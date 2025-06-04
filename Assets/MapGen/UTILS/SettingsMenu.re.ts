import * as RE from 'rogue-engine';
import RuntimeMapGen from 'Assets/MapGen/Lib/RuntimeMapGen.re';

// Define interfaces directly if they are only used within this component
interface ISetting {
    id: string;
    label: string;
    type: 'slider' | 'checkbox' | 'dropdown' | 'button';
    initialValue: any;
    controlProps?: any;
    handler: string; // Change handler to a string representing the method name
    getCurrentValue?: string; // Change getCurrentValue to a string representing the method name
}

interface ISettingsSection {
    id: string;
    title: string;
    settings: ISetting[];
}

interface GameSettings {
    [key: string]: any;
}

@RE.registerComponent
export default class SettingsMenu extends RE.Component {
    private settingsPanel!: HTMLDivElement;
    private sectionNav!: HTMLDivElement;
    private sectionContentArea!: HTMLDivElement;
    private isVisible = false;
    private styleElement!: HTMLStyleElement;
    private closeButton!: HTMLButtonElement;

    private rmgInstance: RuntimeMapGen | null = null;

    private sectionContentDivs: { [id: string]: HTMLDivElement } = {};
    private sectionNavButtons: { [id: string]: HTMLButtonElement } = {};
    private settingControls: { [id: string]: HTMLElement } = {};

    private keyListenerFunc!: (e: KeyboardEvent) => void;

    private currentSettings: GameSettings = {};

    // Remove the hardcoded settingsConfig
    private settingsConfig: ISettingsSection[] = [];

    // Add a public property to specify the path to the settings JSON
    @RE.props.text() settingsConfigPath: string = "game-settings.json"; // Default path, can be changed in editor
    @RE.props.text() SETTINGS_STORAGE_KEY: string = "game-settings"; // localStorage name

    awake() {
        this.rmgInstance = RE.getComponent(RuntimeMapGen) as RuntimeMapGen;
        if (!this.rmgInstance) {
            console.warn("SettingsMenu: RuntimeMapGen component not found on this entity. Graphics settings will not apply.");
        }

        this.addStyles();
        this.loadSettingsConfig().then(() => {
            this.loadAllSettings();
            this.createSettingsButton();
            this.createSettingsPanel();
            this.setupKeyListener();

            if (this.settingsConfig.length > 0) {
                this.showSection(this.settingsConfig[0].id);
            }
        }).catch(error => {
            console.error("Failed to load settings configuration:", error);
            // Optionally, handle error by showing a message or using fallback settings
        });
    }

    start() {
        RE.Runtime.onStop(() => { this.onDestroy(); });
    }

    private async loadSettingsConfig(): Promise<void> {
        try {
            // Use RE.getStaticPath to load the JSON file
            const response = await fetch(RE.getStaticPath(this.settingsConfigPath));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.settingsConfig = await response.json();
            console.log("Settings configuration loaded:", this.settingsConfig);
        } catch (error) {
            console.error("Error loading settings configuration:", error);
            // Fallback to a default or empty configuration if loading fails
            this.settingsConfig = [];
            throw error; // Re-throw to be caught in awake()
        }
    }

    private addStyles() {
        if (document.head.querySelector('#settings-menu-styles')) {
            return;
        }

        this.styleElement = document.createElement('style');
        this.styleElement.id = 'settings-menu-styles';
        this.styleElement.textContent = `
            .settings-button {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 15px;
                background-color: rgba(51, 51, 51, 0.8);
                color: #ffffff;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                z-index: 1000;
                font-family: sans-serif;
                font-size: 1em;
                transition: background-color 0.2s ease;
            }

            .settings-button:hover {
                background-color: rgba(70, 70, 70, 0.9);
            }

            .settings-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(25, 25, 25, 0.95);
                border-radius: 10px;
                color: #ffffff;
                z-index: 1000;
                width: 80%;
                max-width: 800px;
                height: 70%;
                max-height: 600px;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
                font-family: sans-serif;
                opacity: 1;
                transition: opacity 0.3s ease;
                display: flex;
                overflow: hidden;
            }

            .settings-panel.hidden {
                opacity: 0;
                pointer-events: none;
            }

            .settings-close-button {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 30px;
                height: 30px;
                background-color: rgba(80, 80, 80, 0.8);
                color: #ffffff;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1.2em;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: background-color 0.2s ease;
                z-index: 1010;
            }

            .settings-close-button:hover {
                background-color: rgba(120, 0, 0, 0.9);
                color: #ffffff;
            }

             .settings-content-area h3 {
                margin-top: 0;
                margin-bottom: 25px;
                color: #00bfff;
                text-align: center;
                font-size: 1.5em;
            }

            .settings-nav {
                width: 180px;
                flex-shrink: 0;
                background-color: rgba(40, 40, 40, 0.9);
                padding: 20px 0;
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
            }

            .settings-nav-button {
                display: block;
                width: 100%;
                text-align: left;
                padding: 15px 20px;
                border: none;
                background-color: transparent;
                color: #cccccc;
                cursor: pointer;
                font-size: 1em;
                transition: background-color 0.2s ease, color 0.2s ease;
            }

            .settings-nav-button:hover {
                background-color: rgba(60, 60, 60, 0.9);
                color: #ffffff;
            }

            .settings-nav-button.active {
                background-color: #00bfff;
                color: #ffffff;
                font-weight: bold;
            }

            .settings-content-area {
                flex-grow: 1;
                padding: 30px;
                overflow-y: auto;
            }

            .section-content-div {
                display: none;
            }

            .section-content-div.active {
                display: block;
            }

            .setting-control {
                margin-bottom: 15px;
            }

            .setting-control:last-child {
                margin-bottom: 0;
            }

            .setting-control label {
                display: block;
                margin-bottom: 8px;
                font-size: 0.95em;
                color: #cccccc;
            }

            .slider-input-container {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .settings-slider {
                flex-grow: 1;
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 8px;
                background: #555;
                outline: none;
                opacity: 0.9;
                transition: opacity .2s;
                border-radius: 4px;
            }

            .settings-slider:hover {
                opacity: 1;
            }

            .settings-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                background: #00bfff;
                cursor: pointer;
                border-radius: 50%;
                transition: background-color 0.2s ease;
            }

            .settings-slider::-moz-range-thumb {
                width: 18px;
                height: 18px;
                background: #00bfff;
                cursor: pointer;
                border-radius: 50%;
                transition: background-color 0.2s ease;
            }

            .settings-slider::-webkit-slider-thumb:hover,
            .settings-slider::-moz-range-thumb:hover {
                background-color: #4dc3ff;
            }

            .slider-value {
                min-width: 30px;
                text-align: right;
                font-size: 0.95em;
                color: #ffffff;
            }

             .setting-control input[type="checkbox"] {
                margin-right: 5px;
               }

             .setting-control label[for].checkbox-label {
                display: inline-block;
                margin-bottom: 0;
               }

            .settings-warning {
                color: #ff6347;
                font-size: 0.9em;
                margin-top: 20px;
                text-align: center;
                padding-top: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(this.styleElement);
    }

    private createSettingsButton() {
        const btn = document.createElement('button');
        btn.textContent = '⚙️';
        btn.classList.add('settings-button');
        btn.addEventListener('click', () => this.toggleSettings());
        document.body.appendChild(btn);
    }

    private createSettingsPanel() {
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.classList.add('settings-panel');
        this.settingsPanel.classList.add('hidden');

        this.closeButton = document.createElement('button');
        this.closeButton.textContent = '✕';
        this.closeButton.classList.add('settings-close-button');
        this.closeButton.addEventListener('click', () => this.toggleSettings());
        this.settingsPanel.appendChild(this.closeButton);

        const settingsBody = document.createElement('div');
        settingsBody.style.display = 'flex';
        settingsBody.style.width = '100%';
        settingsBody.style.height = '100%';

        this.sectionNav = document.createElement('div');
        this.sectionNav.classList.add('settings-nav');
        settingsBody.appendChild(this.sectionNav);

        this.sectionContentArea = document.createElement('div');
        this.sectionContentArea.classList.add('settings-content-area');
        settingsBody.appendChild(this.sectionContentArea);

        this.settingsPanel.appendChild(settingsBody);

        this.settingsConfig.forEach(sectionConfig => {
            const { button, contentDiv } = this.createSectionElements(sectionConfig.title, sectionConfig.id);

            this.sectionNavButtons[sectionConfig.id] = button;
            this.sectionContentDivs[sectionConfig.id] = contentDiv;

            sectionConfig.settings.forEach(settingConfig => {
                const controlElement = this.createSettingControl(settingConfig, contentDiv);
                if(controlElement) {
                    this.settingControls[settingConfig.id] = controlElement;
                }
            });
        });

        document.body.appendChild(this.settingsPanel);
    }

    private createSectionElements(titleText: string, sectionId: string): { button: HTMLButtonElement, contentDiv: HTMLDivElement } {
        const button = document.createElement('button');
        button.textContent = titleText;
        button.classList.add('settings-nav-button');
        button.dataset.sectionId = sectionId;

        button.addEventListener('click', () => this.showSection(sectionId));

        this.sectionNav.appendChild(button);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('section-content-div');
        contentDiv.dataset.sectionId = sectionId;

        const contentTitle = document.createElement('h3');
        contentTitle.textContent = titleText + ' Settings';
        contentDiv.appendChild(contentTitle);

        this.sectionContentArea.appendChild(contentDiv);

        return { button, contentDiv };
    }

    private createSettingControl(setting: ISetting, contentElement: HTMLDivElement): HTMLElement | null {
        const container = document.createElement('div');
        container.classList.add('setting-control');

        const label = document.createElement('label');
        label.textContent = setting.label;
        label.htmlFor = setting.id;

        let controlElement: HTMLElement | null = null;

        switch (setting.type) {
            case 'slider':
                const inputContainer = document.createElement('div');
                inputContainer.classList.add('slider-input-container');

                const slider = document.createElement('input');
                slider.type = 'range';
                slider.id = setting.id;
                slider.min = (setting.controlProps?.min || 0).toString();
                slider.max = (setting.controlProps?.max || 100).toString();
                slider.step = (setting.controlProps?.step || 1).toString();
                const loadedSliderValue = this.getSettingValue(setting.id, setting.initialValue);
                slider.value = loadedSliderValue.toString();
                slider.classList.add('settings-slider');
                controlElement = slider;

                const valueDisplay = document.createElement('span');
                valueDisplay.textContent = slider.value;
                valueDisplay.classList.add('slider-value');
                valueDisplay.dataset.settingId = setting.id;

                slider.addEventListener('input', (e) => {
                    const currentValue = (e.target as HTMLInputElement).value;
                    valueDisplay.textContent = currentValue;
                    // Dynamically call the handler method
                    if (setting.handler && typeof (this as any)[setting.handler] === 'function') {
                        (this as any)[setting.handler](parseFloat(currentValue), this);
                    } else {
                        console.warn(`Handler method "${setting.handler}" not found for setting "${setting.id}".`);
                    }
                });

                container.appendChild(label);
                inputContainer.appendChild(slider);
                inputContainer.appendChild(valueDisplay);
                container.appendChild(inputContainer);
                break;

            case 'checkbox':
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = setting.id;
                const loadedCheckboxValue = this.getSettingValue(setting.id, setting.initialValue);
                checkbox.checked = loadedCheckboxValue as boolean;
                controlElement = checkbox;

                label.classList.add('checkbox-label');
                label.appendChild(checkbox);

                checkbox.addEventListener('change', (e) => {
                    // Dynamically call the handler method
                    if (setting.handler && typeof (this as any)[setting.handler] === 'function') {
                        (this as any)[setting.handler]((e.target as HTMLInputElement).checked, this);
                    } else {
                        console.warn(`Handler method "${setting.handler}" not found for setting "${setting.id}".`);
                    }
                });

                container.appendChild(label);
                break;

            default:
                console.warn(`Unknown setting type: ${setting.type}`);
                return null;
        }

        if (controlElement) {
            contentElement.appendChild(container);
        }

        return controlElement;
    }

    private showSection(sectionId: string) {
        for (const id in this.sectionContentDivs) {
            this.sectionContentDivs[id].classList.remove('active');
        }

        for (const id in this.sectionNavButtons) {
            this.sectionNavButtons[id].classList.remove('active');
        }

        const activeContentDiv = this.sectionContentDivs[sectionId];
        if (activeContentDiv) {
            activeContentDiv.classList.add('active');
        }

        const activeButton = this.sectionNavButtons[sectionId];
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    private setupKeyListener() {
        this.keyListenerFunc = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'p' || e.key === 'Escape') {
                this.toggleSettings();
            }
        };
        document.addEventListener('keydown', this.keyListenerFunc);
    }

    private toggleSettings() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.settingsPanel.classList.remove('hidden');

            this.settingsConfig.forEach(sectionConfig => {
                sectionConfig.settings.forEach(settingConfig => {
                    const control = this.settingControls[settingConfig.id];
                    if (control) {
                        let currentValue;
                        if (settingConfig.getCurrentValue && typeof (this as any)[settingConfig.getCurrentValue] === 'function') {
                            currentValue = (this as any)[settingConfig.getCurrentValue](this);
                        } else {
                            currentValue = this.getSettingValue(settingConfig.id, settingConfig.initialValue);
                        }

                        switch (settingConfig.type) {
                            case 'slider':
                                const slider = control as HTMLInputElement;
                                slider.value = currentValue.toString();
                                const valueDisplay = slider.nextElementSibling as HTMLSpanElement;
                                if (valueDisplay && valueDisplay.classList.contains('slider-value')) {
                                    valueDisplay.textContent = slider.value;
                                }
                                break;
                            case 'checkbox':
                                (control as HTMLInputElement).checked = currentValue as boolean;
                                break;
                        }
                    }
                });
            });

            if (this.settingsConfig.length > 0) {
                const activeSection = Object.values(this.sectionContentDivs).find(div => div.classList.contains('active'));
                if (!activeSection) {
                    this.showSection(this.settingsConfig[0].id);
                }
            }

        } else {
            this.settingsPanel.classList.add('hidden');
        }
    }

    private saveSetting(id: string, value: any) {
        this.currentSettings[id] = value;
        try {
            localStorage.setItem(this.SETTINGS_STORAGE_KEY, JSON.stringify(this.currentSettings));
        } catch (e) {
            console.error(`Error saving setting '${id}' to localStorage:`, e);
        }
    }

    private loadAllSettings() {
        try {
            const storedSettings = localStorage.getItem(this.SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                this.currentSettings = JSON.parse(storedSettings);
            } else {
                this.currentSettings = {};
            }
        } catch (e) {
            console.warn(`Error loading or parsing game settings from localStorage, starting with default settings:`, e);
            this.currentSettings = {};
        }

        // Apply loaded settings using the handlers specified in the config
        this.settingsConfig.forEach(sectionConfig => {
            sectionConfig.settings.forEach(settingConfig => {
                const loadedValue = this.getSettingValue(settingConfig.id, settingConfig.initialValue);
                if (settingConfig.handler && typeof (this as any)[settingConfig.handler] === 'function') {
                    (this as any)[settingConfig.handler](loadedValue, this);
                } else {
                    console.warn(`Handler method "${settingConfig.handler}" not found for setting "${settingConfig.id}".`);
                }
            });
        });
    }

    private getSettingValue(id: string, defaultValue: any): any {
        return this.currentSettings[id] !== undefined ? this.currentSettings[id] : defaultValue;
    }

    public getAllSettings(): GameSettings {
        return { ...this.currentSettings };
    }

    // #region Specific Setting Handlers 
    // These methods are public and callable via their string names from the JSON config.
    public handleHighRenderDistance(value: number, component: SettingsMenu) {
        if (component.rmgInstance) {
            component.rmgInstance.high_RenderDistance = value;
            component.rmgInstance.highRenderDistanceSquared = value * value;
        }
        component.saveSetting('highRenderDistance', value);
    }

    public getHighRenderDistance(component: SettingsMenu): number {
        return component.getSettingValue('highRenderDistance', 3); // Default value from initial config
    }

    public handleLowRenderDistance(value: number, component: SettingsMenu) {
        if (component.rmgInstance) {
            component.rmgInstance.low_RenderDistance = value;
            component.rmgInstance.lowRenderDistanceSquared = value * value;
        }
        component.saveSetting('lowRenderDistance', value);
    }

    public getLowRenderDistance(component: SettingsMenu): number {
        return component.getSettingValue('lowRenderDistance', 14); // Default value from initial config
    }

    public handleMasterVolume(value: number, component: SettingsMenu) {
        console.log(`Audio Volume set to: ${value}`);
        // Add actual audio volume logic here (e.g., RE.Audio.setMasterVolume(value / 100))
        component.saveSetting('masterVolume', value);
    }

    public getMasterVolume(component: SettingsMenu): number {
        return component.getSettingValue('masterVolume', 100); // Default value from initial config
    }

    onDestroy() {
        if (this.settingsPanel && this.settingsPanel.parentElement) {
            this.settingsPanel.parentElement.removeChild(this.settingsPanel);
        }
        const settingsButton = document.querySelector('.settings-button');
        if (settingsButton && settingsButton.parentElement) {
            settingsButton.parentElement.removeChild(settingsButton);
        }
        const styleElement = document.head.querySelector('#settings-menu-styles');
        if (styleElement && styleElement.parentElement) {
            styleElement.parentElement.removeChild(styleElement);
        }

        if (this.keyListenerFunc) {
            document.removeEventListener('keydown', this.keyListenerFunc);
        }

        this.sectionContentDivs = {};
        this.sectionNavButtons = {};
        this.settingControls = {};
        this.rmgInstance = null;
        this.currentSettings = {};
    }
}