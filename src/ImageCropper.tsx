import React from "react";
import Slider from "./radix-ui/Slider";
import { useGesture } from "@use-gesture/react";

type Props = {
  zoom?: number;
  setZoom?: (zoom: number) => void;
  rotation?: number;
  setRotation?: (rotation: number) => void;
  imageSrc?: string;
  setImageSrc?: (imageSrc: string) => void;
};

interface Vector2 {
  x: number;
  y: number;
}

const ImageCropper = (props: Props) => {
  // Refs
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // State
  const imageSrc = React.useRef<string>("");
  const zoom = React.useRef<number>(1);
  const rotation = React.useRef<number>(0);
  const pan = React.useRef<Vector2>({ x: 0, y: 0 });

  function updateCanvas() {
    // Get canvas and context
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    // Clear canvas
    // context.clearRect(0, 0, canvas.width, canvas.height);

    // Load image
    const image = new Image();
    image.src = imageSrc.current;
    image.onload = () => {
      const { width, height } = image;
      const size = Math.min(width, height);

      // Set canvas size
      canvas.width = size;
      canvas.height = size;

      // Dimensions for cropping the source image (no cropping for now)
      const sWidth = width;
      const sHeight = height;
      const sx = 0;
      const sy = 0;

      // Dimensions for drawing
      const dWidth = sWidth * zoom.current;
      const dHeight = sHeight * zoom.current;
      const dx = -dWidth / 2;
      const dy = -dHeight / 2;

      context.translate(
        size / 2 + (pan.current.x * dWidth) / 2,
        size / 2 + (pan.current.y * dHeight) / 2,
      );
      context.rotate((rotation.current * Math.PI) / 180);
      // context.scale(zoom.current, zoom.current);
      context.drawImage(
        image, // source image
        sx, // offset crop x from source image
        sy, // offset crop y from source image
        sWidth, // crop width from source image
        sHeight, // crop height from source image
        dx, // x position on canvas
        dy, // y position on canvas
        dWidth, // width on canvas
        dHeight, // height on canvas
      );
    };
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Reset zoom and rotation
    zoom.current = 0.5;
    rotation.current = 0;

    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === "string") {
          imageSrc.current = dataUrl;

          // Update canvas
          updateCanvas();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleZoomChange(value: number[]) {
    const newZoom = value[0];
    zoom.current = newZoom;

    // Update canvas
    updateCanvas();
  }

  function handleRotationChange(value: number[]) {
    const newRotation = value[0];
    rotation.current = newRotation;

    // Update canvas
    updateCanvas();
  }

  function handlePanXChange(value: number[]) {
    const x = value[0];
    pan.current = { ...pan.current, x };

    // Update canvas
    updateCanvas();
  }

  function handlePanYChange(value: number[]) {
    const y = value[0];
    pan.current = { ...pan.current, y };

    // Update canvas
    updateCanvas();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Save cropped image for download
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context && canvas) {
      const croppedImage = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = croppedImage;
      a.download = "cropped-image.png";
      a.click();
    }
  }

  // Gesture handling
  // MacOS Trackpad gestures need to be handled via ref and event listeners; they are not accessible in React
  React.useEffect(() => {
    const trackpadGestureHandler = (e: WheelEvent) => {
      if (e.ctrlKey) {
        zoom.current += -e.deltaY / 100;
        // Limit zoom min to 0.5
        zoom.current = Math.max(0.25, zoom.current);

        // Update canvas
        updateCanvas();
      }
    };

    window.addEventListener("wheel", trackpadGestureHandler);
    return () => {
      window.removeEventListener("wheel", trackpadGestureHandler);
    };
  }, []);

  useGesture(
    {
      onDrag: ({ delta: [mx, my] }) => {
        pan.current = {
          x: pan.current.x + mx / 100,
          y: pan.current.y + my / 100,
        };

        // Update canvas
        updateCanvas();
      },
      onPinch: ({ offset: [scaleOffset, pinchAngleOffset] }) => {
        zoom.current = scaleOffset;
        rotation.current = pinchAngleOffset;

        // Update canvas
        updateCanvas();
      },
    },
    {
      target: canvasContainerRef,
    },
  );

  return (
    <>
      {/* Image Preview */}
      <div
        ref={canvasContainerRef}
        className="relative aspect-square w-full touch-none overflow-clip rounded bg-white/10"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
      <form className="mt-6 w-full" onSubmit={handleSubmit}>
        <div className="space-y-2.5">
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <Slider
            ariaLabel="Zoom"
            defaultValue={[1]}
            min={0.5}
            max={1.5}
            step={0.001}
            onValueChange={handleZoomChange}
          />
          <Slider
            ariaLabel="Rotation"
            defaultValue={[0]}
            min={-180}
            max={180}
            step={1}
            onValueChange={handleRotationChange}
          />
          <Slider
            ariaLabel="Pan X"
            defaultValue={[0]}
            min={-1}
            max={1}
            step={0.001}
            onValueChange={handlePanXChange}
          />
          <Slider
            ariaLabel="Pan Y"
            defaultValue={[0]}
            min={-1}
            max={1}
            step={0.001}
            onValueChange={handlePanYChange}
          />
        </div>

        <button
          type="submit"
          className="mt-4 rounded bg-blue-500 px-2 py-1.5 font-medium text-white"
        >
          Submit
        </button>
      </form>
    </>
  );
};

export default ImageCropper;
