
export class MessageManager {

    private ids: string[] = [];
    private _messages: Record<string, string> = $state({});
    public messages: string[] = $derived(Object.values(this._messages));


    add(id: string, message: string): void {
        if (!this.ids.includes(id)) {
            this.ids.push(id);
        }
        this._messages = { ...this._messages, [id]: message };
    }

    reset(): void {
        this.ids = [];
        this._messages = {};
    }
}