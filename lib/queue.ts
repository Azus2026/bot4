type Task<T> = () => Promise<T>;

interface QueueItem<T> {
  task: Task<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  retries: number;
}

export class AnalysisQueue {
  private static instance: AnalysisQueue;
  private queue: QueueItem<any>[] = [];
  private activeCount: number = 0;
  private maxConcurrency: number = 2;
  private listeners: Array<(active: number, pending: number) => void> = [];

  private constructor() {}

  public static getInstance(): AnalysisQueue {
    if (!AnalysisQueue.instance) {
      AnalysisQueue.instance = new AnalysisQueue();
    }
    return AnalysisQueue.instance;
  }

  public subscribe(listener: (active: number, pending: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.activeCount, this.queue.length);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.activeCount, this.queue.length));
  }

  public enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject, retries: 0 });
      this.notify();
      this.processNext();
    });
  }

  private async processNext() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeCount++;
    this.notify();

    try {
      const result = await item.task();
      item.resolve(result);
    } catch (err: any) {
      // Reintento con backoff exponencial si hay limitación de tasa (429)
      const isRateLimited = err?.status === 429 || (err?.message && err.message.includes("429"));
      if (isRateLimited && item.retries < 3) {
        item.retries++;
        const delay = Math.pow(2, item.retries) * 1000;
        console.warn(`Límite 429 alcanzado. Reintentando tarea en ${delay}ms (intento ${item.retries}/3)...`);
        setTimeout(() => {
          this.queue.unshift(item);
          this.notify();
          this.processNext();
        }, delay);
      } else {
        item.reject(err);
      }
    } finally {
      this.activeCount--;
      this.notify();
      this.processNext();
    }
  }

  public getStatus() {
    return {
      active: this.activeCount,
      pending: this.queue.length,
    };
  }
}
