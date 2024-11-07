import "./App.css";
import { createSignal, onCleanup, createEffect, onMount } from "solid-js";
import { listen } from "@tauri-apps/api/event";
import { checkForAppUpdates } from "./updater";

const images = import.meta.glob("./assets/koi-frames/*.png", { eager: true });


function App() {
  onMount(async () => {
    await checkForAppUpdates();
  });
  let koiRef: HTMLDivElement;

  type Position = {
    x: number;
    y: number;
  };

  const homePosition = { x: 0, y: 0 };

  const [position, setPosition] = createSignal(homePosition);
  const [direction, setDirection] = createSignal(0);
  const [frame, setFrame] = createSignal(1);

  const incrementNumber = () => setFrame((prev) => (prev % 12) + 1);

  createEffect(() => {const interval = setInterval(incrementNumber, 50);

  onCleanup(() => clearInterval(interval));
  });

  listen<Position>("mouse_click", (event) => {
    if (sendHome(event.payload)) return;

    calculateDirection(position(), event.payload);
    setPosition(event.payload);
  });

  const sendHome = (clickPosition: Position) => {
    if (!koiRef) return false;

    const boundingBox = koiRef.getBoundingClientRect();
    if (!boundingBoxIsClicked(boundingBox, clickPosition)) return false;

    calculateDirection(position(), homePosition);
    setPosition(homePosition);
    return true;
  };

  const boundingBoxIsClicked = (
    boundingBox: DOMRect,
    clickPosition: Position
  ) => {
    const { x, y } = clickPosition;

    return (
      x > boundingBox.left &&
      x < boundingBox.right &&
      y > boundingBox.top &&
      y < boundingBox.bottom
    );
  };

  const calculateDirection = (oldPosition: Position, newPosition: Position) => {
    const x = oldPosition.x - newPosition.x;
    const y = oldPosition.y - newPosition.y;
    let angle = (Math.atan2(y, x) * 180) / Math.PI;

    if (angle < 0) angle = 360 + angle;
    
    const roundToNearest15 = Math.round(angle / 15) * 15;
    roundToNearest15  === 360 ? 0 : roundToNearest15;
    setDirection(roundToNearest15);
  };

  const calculateStyle = (position: Position) => {
    return `position: absolute; left: ${position.x - 90}px; top: ${
      position.y - 75
    }px; 
    animation-timing-function: ease-in-out;
    transition: top 1.5s, left 1.5s, transform 0.5s;
  `;
  };

  return (
    <div class="container">
      <div style={calculateStyle(position())} ref={koiRef}>
        <img class="koi" width={175} src={images[`./assets/koi-frames/koi-${direction().toString().padStart(3, '0')}-${frame().toString().padStart(2, '0')}.png`].default} />
      </div>
    </div>
  );
}

export default App;
