interface StopwatchState {
    id: string;
    name: string;
    elapsedTime: number;
    isRunning: boolean;
}

interface StopwatchControls {
    nameDisplay: HTMLDivElement;
    timeDisplay: HTMLDivElement;
    startBtn: HTMLButtonElement;
    pauseBtn: HTMLButtonElement;
    resetBtn: HTMLButtonElement;
    deleteBtn: HTMLButtonElement;
}

class Stopwatch {
    private startTime: number = 0;
    private elapsedTime: number = 0;
    private timerInterval: number | null = null;
    private controls: StopwatchControls;
    private isEditing: boolean = false;
    private id: string;

    constructor(private element: HTMLElement, initialState?: StopwatchState) {
        this.id = initialState?.id || element.id;
        this.elapsedTime = initialState?.elapsedTime || 0;

        this.controls = {
            nameDisplay: element.querySelector('.stopwatch-name') as HTMLDivElement,
            timeDisplay: element.querySelector('.stopwatch-display') as HTMLDivElement,
            startBtn: element.querySelector('.start-btn') as HTMLButtonElement,
            pauseBtn: element.querySelector('.pause-btn') as HTMLButtonElement,
            resetBtn: element.querySelector('.reset-btn') as HTMLButtonElement,
            deleteBtn: element.querySelector('.delete-btn') as HTMLButtonElement
        };

        this.initializeControls();
        this.updateDisplay();

        if (initialState?.isRunning) {
            this.start();
        }
    }

    private initializeControls(): void {
        this.controls.startBtn.addEventListener('click', () => this.start());
        this.controls.pauseBtn.addEventListener('click', () => this.pause());
        this.controls.resetBtn.addEventListener('click', () => this.reset());
        this.controls.deleteBtn.addEventListener('click', () => this.delete());
        this.controls.nameDisplay.addEventListener('click', () => this.startEditing());
    }

    private updateDisplay(): void {
        this.controls.timeDisplay.textContent = this.formatTime(this.elapsedTime);
    }

    private startEditing(): void {
        if (this.isEditing) return;

        this.isEditing = true;
        const currentName = this.controls.nameDisplay.textContent || 'Stopwatch';
        this.controls.nameDisplay.innerHTML = `
            <input type="text" class="name-input" value="${currentName}">
        `;

        const input = this.controls.nameDisplay.querySelector('input') as HTMLInputElement;
        input.focus();
        input.select();

        const finishEditing = () => {
            const newName = input.value.trim() || 'Stopwatch';
            this.controls.nameDisplay.textContent = newName;
            this.isEditing = false;
            this.saveState();
        };

        input.addEventListener('blur', finishEditing);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            }
        });
    }

    private start(): void {
        this.startTime = Date.now() - this.elapsedTime;
        this.timerInterval = window.setInterval(() => this.updateTime(), 10);
        this.controls.startBtn.disabled = true;
        this.controls.pauseBtn.disabled = false;
        this.controls.resetBtn.disabled = false;
        this.saveState();
    }

    private pause(): void {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.controls.startBtn.disabled = false;
        this.controls.pauseBtn.disabled = true;
        this.saveState();
    }

    private reset(): void {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.elapsedTime = 0;
        this.updateDisplay();
        this.controls.startBtn.disabled = false;
        this.controls.pauseBtn.disabled = true;
        this.controls.resetBtn.disabled = true;
        this.saveState();
    }

    private delete(): void {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
        }
        this.element.remove();
        this.removeState();
    }

    private updateTime(): void {
        this.elapsedTime = Date.now() - this.startTime;
        this.updateDisplay();
        this.saveState();
    }

    private formatTime(ms: number): string {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const tenths = Math.floor((ms % 1000) / 100);

        const hoursStr = String(hours).padStart(2, '0');
        const minutesStr = String(minutes).padStart(2, '0');
        const secondsStr = String(seconds).padStart(2, '0');

        return `${hoursStr}:${minutesStr}:${secondsStr}.${tenths}`;
    }

    private saveState(): void {
        const state: StopwatchState = {
            id: this.id,
            name: this.controls.nameDisplay.textContent || 'Stopwatch',
            elapsedTime: this.elapsedTime,
            isRunning: this.timerInterval !== null
        };

        const states = this.loadAllStates();
        states[this.id] = state;
        localStorage.setItem('stopwatches', JSON.stringify(states));
    }

    private removeState(): void {
        const states = this.loadAllStates();
        delete states[this.id];
        localStorage.setItem('stopwatches', JSON.stringify(states));
    }

    private loadAllStates(): Record<string, StopwatchState> {
        const stored = localStorage.getItem('stopwatches');
        return stored ? JSON.parse(stored) : {};
    }
}

class StopwatchManager {
    private stopwatchCounter: number = 0;
    private readonly listElement: HTMLElement;

    constructor() {
        const addButton = document.getElementById('addStopwatch');
        this.listElement = document.getElementById('stopwatchList') as HTMLElement;

        if (!addButton || !this.listElement) {
            throw new Error('Required DOM elements not found');
        }

        addButton.addEventListener('click', () => this.createStopwatch());

        // Restore saved stopwatches or create a default one
        this.restoreStopwatches();
    }

    private restoreStopwatches(): void {
        const stored = localStorage.getItem('stopwatches');
        const states: Record<string, StopwatchState> = stored ? JSON.parse(stored) : {};

        if (Object.keys(states).length === 0) {
            this.createStopwatch(); // Create default stopwatch if no saved states
            return;
        }

        // Restore all saved stopwatches
        Object.values(states).forEach(state => {
            const id = parseInt(state.id.split('-')[1]);
            this.stopwatchCounter = Math.max(this.stopwatchCounter, id + 1);
            this.createStopwatch(state);
        });
    }

    private createStopwatch(state?: StopwatchState): void {
        const stopwatchId = state?.id || `stopwatch-${this.stopwatchCounter++}`;
        const stopwatchElement = document.createElement('div');
        stopwatchElement.className = 'stopwatch';
        stopwatchElement.id = stopwatchId;
        stopwatchElement.innerHTML = `
            <button class="delete-btn" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <div class="stopwatch-container">
                <div class="stopwatch-info">
                    <div class="stopwatch-name">${state?.name || `Stopwatch ${this.stopwatchCounter}`}</div>
                    <div class="stopwatch-display">00:00:00.0</div>
                </div>
                <div class="stopwatch-controls">
                    <div class="play-pause-container">
                        <button class="start-btn" title="Start">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                        <button class="pause-btn" title="Pause" disabled>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                        </button>
                    </div>
                    <button class="reset-btn" title="Stop" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 6h12v12H6z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        this.listElement.appendChild(stopwatchElement);
        new Stopwatch(stopwatchElement, state);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new StopwatchManager();
});