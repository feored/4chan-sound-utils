
export class MessageManager {

    private ids: string[] = [];
    public messages: Record<string, string> = $state({});

    add(id: string, message: string): void {
        if (!this.ids.includes(id)) {
            this.ids.push(id);
        }
        this.messages = { ...this.messages, [id]: message };
        console.log(`${message} (${id})`);
    }

    reset(): void {
        this.ids = [];
        this.messages = {};
    }
}