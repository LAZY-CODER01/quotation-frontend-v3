type Listener = (count: number) => void;

class RequestStore {
    private count = 0;
    private listeners: Listener[] = [];

    subscribe(listener: Listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach((listener) => listener(this.count));
    }

    increment() {
        this.count++;
        this.notify();
    }

    decrement() {
        if (this.count > 0) {
            this.count--;
            this.notify();
        }
    }

    getCount() {
        return this.count;
    }
}

export const requestStore = new RequestStore();
