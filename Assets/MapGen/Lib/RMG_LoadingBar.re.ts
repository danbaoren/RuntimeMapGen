import * as RE from 'rogue-engine';
import RuntimeMapGen from "./RuntimeMapGen.re";

export default class RMG_LoadingBar{

// #region LOADING BAR


    public static progressBarContainer: HTMLDivElement;
    public static loadingText: HTMLDivElement;
    public static isProgressVisible = false;
    public static gameStartTime: number = 0;
    public static tileIndicatorContainer: HTMLDivElement | null = null;
    public static tileIndicators: HTMLElement[] = [];
    public static totalTilesToProcess: number = 0;
    public static currentLoadMsg: string = "";

    public static createProgressBar() {
        // Convert THREE.Color objects to CSS strings.
        const loadedColorCss = RuntimeMapGen.get().loaded_tiles_color.getStyle();
        const unloadedColorCss = RuntimeMapGen.get().unloaded_tiles_color.getStyle();

        // Create and inject CSS animations and styles.
        const style = document.createElement('style');
        style.innerHTML = `
            /* Subtle fade-in pulse animation for the loading text */
            @keyframes pulseFade {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.05); opacity: 1; }
            }
            .loading-text {
                animation: pulseFade 2s infinite ease-in-out;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 1);
                padding: 5px 10px;
                border-radius: 5px;
            }
            @keyframes borderGlow {
                0% { box-shadow: 0 0 3px rgba(100, 149, 237, 0.3); }
                50% { box-shadow: 0 0 10px rgba(100, 149, 237, 0.7); }
                100% { box-shadow: 0 0 3px rgba(100, 149, 237, 0.3); }
            }
            .progress-bar-glow {
                animation: borderGlow 2.5s infinite;
                box-shadow: 2px 2px 5px rgba(0, 0, 0, 1);
            }
            .inner-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 10px;
                border-radius: 0;
            }
            .tile-indicator-container {
                display: grid;
                gap: 1px;
                margin-top: 5px;
                width: 150px;
                height: 150px;
            }
            .tile-indicator {
                background-color: ${unloadedColorCss};
                border-radius: 1px;
                box-sizing: border-box;
            }
            .tile-indicator.loaded {
                background-color: ${loadedColorCss};
            }
        `;
        document.head.appendChild(style);

        // Create the main container for the progress bar.
        this.progressBarContainer = document.createElement('div');
        Object.assign(this.progressBarContainer.style, {
            position: 'fixed',
            left: '0',
            bottom: '0',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '2000',
            transition: 'opacity 0.3s ease',
            opacity: '0',
            paddingBottom: '30px'
        });

        // Create inner container.
        const innerContainer = document.createElement('div');
        innerContainer.classList.add('inner-container');

        // Create and style the loading text.
        this.loadingText = document.createElement('div');
        Object.assign(this.loadingText.style, {
            color: '#E0E0E0',
            fontSize: '18px',
            marginBottom: '5px',
            fontWeight: '400',
            textAlign: 'center'
        });

        // Initialize the current message with a random message.
        const randomIndex = Math.floor(Math.random() * RuntimeMapGen.get().load_msgs.length);
        this.currentLoadMsg = RuntimeMapGen.get().load_msgs[randomIndex];
        this.loadingText.textContent = `--- ${this.currentLoadMsg} 0/0 ---`;
        this.loadingText.classList.add('loading-text');
        innerContainer.appendChild(this.loadingText);

        // Create the tile indicator container.
        this.tileIndicatorContainer = document.createElement('div');
        this.tileIndicatorContainer.classList.add('tile-indicator-container');
        Object.assign(this.tileIndicatorContainer.style, {
            width: '150px',
            height: '150px',
            display: 'grid',
            gap: '1px',
            marginTop: '5px'
        });
        innerContainer.appendChild(this.tileIndicatorContainer);

        // Append the inner container to the main container and insert into the document.
        this.progressBarContainer.appendChild(innerContainer);
        document.body.appendChild(this.progressBarContainer);
        this.isProgressVisible = false;
        this.gameStartTime = performance.now();
    }

    public static showProgressBar() {
        if (!RMG_LoadingBar.isProgressVisible) {
            RMG_LoadingBar.progressBarContainer.style.opacity = '1';
            RMG_LoadingBar.isProgressVisible = true;
            RMG_LoadingBar.animateLoadingText();
        }
    }

    private static animateLoadingText() {
        const loadingTextContent = 'L o a d i n g';
        this.loadingText.textContent = '';
        loadingTextContent.split('').forEach((letter, index) => {
            const letterSpan = document.createElement('span');
            letterSpan.textContent = letter;
            letterSpan.style.opacity = '0';
            letterSpan.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            letterSpan.style.display = 'inline-block';
            letterSpan.style.transform = 'translateY(5px)';
            this.loadingText.appendChild(letterSpan);
            setTimeout(() => {
                letterSpan.style.opacity = '1';
                letterSpan.style.transform = 'translateY(0)';
            }, 50 * (index + 1));
        });
    }

    public static updateProgress(processedTileCount: number) {
        if (!this.isProgressVisible) this.showProgressBar();
        if (this.tileIndicators && this.tileIndicators.length > processedTileCount - 1) {
            this.tileIndicators[processedTileCount - 1].classList.add('loaded');
        }
        this.updateLoadingText(processedTileCount);
    }

    private static updateLoadingText(processedTileCount: number) {
        const loadingTextElement = this.loadingText;
        if (loadingTextElement) {
            // Every msg_next_tiles chunks, switch to a new random message.
            if (processedTileCount % RuntimeMapGen.get().msg_next_tiles === 0) {
                const randomIndex = Math.floor(Math.random() * RuntimeMapGen.get().load_msgs.length);
                this.currentLoadMsg = RuntimeMapGen.get().load_msgs[randomIndex];
            }

            // Update the text with the current message and tile counts.
            loadingTextElement.textContent = `--- ${this.currentLoadMsg} ${processedTileCount}/${this.totalTilesToProcess} ---`;

            // If the current message starts with "Loading", run the tile count update animation.
            if (this.currentLoadMsg.startsWith("Loading")) {
                this.animateTileCountUpdate();
            }
        }
    }

    private static animateTileCountUpdate() {
        const fullText = `Loading Tiles ${this.loadingText.textContent?.split(' ')[2] || '0/0'}`;
        this.loadingText.textContent = '';
        fullText.split('').forEach((char, index) => {
            const charSpan = document.createElement('span');
            charSpan.textContent = char;
            charSpan.style.opacity = '0';
            charSpan.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            charSpan.style.display = 'inline-block';
            charSpan.style.transform = 'translateY(5px)';
            this.loadingText.appendChild(charSpan);
            setTimeout(() => {
                charSpan.style.opacity = '1';
                charSpan.style.transform = 'translateY(0)';
            }, 30 * (index + 1));
        });
    }

    public static hideProgressBar() {
        const elapsed = performance.now() - this.gameStartTime;
        const minDuration = 10 * 100; // 10 seconds in milliseconds

        const hideAction = () => {
            this.progressBarContainer.style.opacity = '0';
            setTimeout(() => {
                if (this.progressBarContainer.parentElement) {
                    document.body.removeChild(this.progressBarContainer);
                }
                this.isProgressVisible = false;
                this.tileIndicatorContainer = null;
                this.tileIndicators = [];
            }, 300);
        };

        if (elapsed < minDuration) {
            setTimeout(hideAction, minDuration - elapsed);
        } else {
            hideAction();
        }
    }


}
