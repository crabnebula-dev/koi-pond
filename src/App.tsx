const FPS = 60
const INTERVAL_MILLISECONDS = 1000 / FPS
const FRAME_SIZE = 256
const HALF_FRAME_SIZE = FRAME_SIZE / 2
const ROTATION_STEP = 15
const ROTATION_STEP_OFFSET = 6
const RAD_TO_DEG =  180 / Math.PI
const MAX_SPEED = 15
const MIN_SPEED =1
const ACCELERATION = 0.1
import "./App.css";
import {createSignal, onCleanup, createEffect} from "solid-js";
import {listen} from "@tauri-apps/api/event";

import {info} from '@tauri-apps/plugin-log'

const IMAGES = import.meta.glob("./assets/koi-frames/*.png", {eager: true});



function App() {

  function convertRadsToDirection(rads: number) {
    let direction = rads  * RAD_TO_DEG
    const remainder = direction % ROTATION_STEP
    direction -= remainder
    if (remainder > ROTATION_STEP_OFFSET) direction += ROTATION_STEP
    while (direction < 0 || direction >= 360) {
      if (direction < 0) {
        direction += 360
      } else {
        direction -= 360
      }
    }
    return direction
  }

  type Position = {
    x: number;
    y: number;
  };

  let frameCounter = MIN_SPEED
  let speed = MIN_SPEED
  let heading = 0
  const homePosition = {x: 500, y: 500};

  const [fishPosition, setFishPosition] = createSignal(homePosition);
  const [targetPosition, setTargetPosition] = createSignal(homePosition);
  const [frame, setFrame] = createSignal(1);
  const [direction, setDirection] = createSignal(0);

  function calculateNewRelativePosition(angleRad: number, length: number, xOffset: number, yOffset: number): Position {
    return {
      x: (length * Math.cos(angleRad - Math.PI)) + xOffset,
      y: (length * Math.sin(angleRad - Math.PI)) + yOffset
    };
  }

  const processFrame = () => {
    const {x: targetX, y: targetY} = targetPosition()
    const {x: originalFishX, y: originalFishY} = fishPosition()
    const w = originalFishX - targetX;
    const h = originalFishY - targetY;
    const angleRad = Math.atan2(h, w);

    if (angleRad > heading) heading-= 0.5
    if (angleRad < heading) heading+= 0.5

    const direction = convertRadsToDirection(angleRad)
    const distance = Math.hypot(w, h)
    if (distance > MAX_SPEED) {
      if (speed<MAX_SPEED) {
        speed+=ACCELERATION
        setDirection(direction);
      }
    } else {
      if (speed>MIN_SPEED) {
        speed = MIN_SPEED
      }
    }

    const newPosition = calculateNewRelativePosition(angleRad, speed, originalFishX, originalFishY)
    setFishPosition(newPosition)
    frameCounter-= 1
    if (frameCounter < 1) {
      frameCounter = 5 - (speed / 3)
      setFrame((prev) => (prev % 12) + 1)
    }
  };

  createEffect(() => {
    const interval = setInterval(processFrame, INTERVAL_MILLISECONDS);
    onCleanup(() => clearInterval(interval));
  });

  listen<Position>("mouse_move", (event) => {
    setTargetPosition(event.payload);
  });

  const calculateStyle = (position: Position) => {
    return `position: absolute; left: ${position.x - HALF_FRAME_SIZE}px; top: ${position.y - HALF_FRAME_SIZE}px;`;
  };

  return (
    <div class="container">
      <div style={calculateStyle(fishPosition())}>
        <img class="koi" width={FRAME_SIZE}
             src={IMAGES[`./assets/koi-frames/koi-${direction().toString().padStart(3, '0')}-${frame().toString().padStart(2, '0')}.png`].default}/>
      </div>
    </div>
  );
}

export default App;
