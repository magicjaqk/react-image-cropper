import React from "react";
import Slider from "./radix-ui/Slider";
import { useGesture } from "@use-gesture/react";

type Props = {
  // Manipulation props -- State and setters
  zoom?: number;
  setZoom?: (zoom: number) => void;
  rotation?: number;
  setRotation?: (rotation: number) => void;
  imageSrc?: string;
  setImageSrc?: (imageSrc: string) => void;

  // Cropped image props
  resolutionPx?: number; // Resolution of the cropped image (default 1)
};

interface Vector2 {
  x: number;
  y: number;
}

const ImageCropper = ({ resolutionPx, ...props }: Props) => {
  // Refs for canvas and container
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Data refs
  const imageSrc = React.useRef<string>("");
  const zoom = React.useRef<number>(1);
  const rotation = React.useRef<number>(0);
  const pan = React.useRef<Vector2>({ x: 0, y: 0 });

  function updateCanvas() {
    // Get canvas and context
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    // Load image
    const image = new Image();
    image.src = imageSrc.current;
    image.onload = () => {
      const { width, height } = image;

      // Set canvas resolution
      const size =
        resolutionPx ??
        canvasContainerRef.current?.getBoundingClientRect().width ??
        512;
      canvas.width = size;
      canvas.height = size;

      // Dimensions for cropping the source image (no cropping for now)
      const sWidth = width;
      const sHeight = height;
      const sx = 0;
      const sy = 0;

      // Dimensions for drawing
      const ratio = sWidth > sHeight ? sHeight / size : sWidth / size;
      const dWidth = (sWidth * zoom.current) / ratio;
      const dHeight = (sHeight * zoom.current) / ratio;
      const dx = -dWidth / 2;
      const dy = -dHeight / 2;

      // Position and rotate image
      context.translate(size / 2 + pan.current.x, size / 2 + pan.current.y);
      context.rotate((rotation.current * Math.PI) / 180);

      // Draw image
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
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === "string") {
          imageSrc.current = dataUrl;

          handlePanXChange(0);
          handleZoomChange(1);
          handleRotationChange(0);

          // Update canvas
          updateCanvas();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleZoomChange(value: number) {
    const newZoom = Math.max(0.25, value);
    zoom.current = newZoom;

    // Update canvas
    updateCanvas();
  }

  function handleRotationChange(value: number) {
    const newRotation = value;
    rotation.current = newRotation;

    // Update canvas
    updateCanvas();
  }

  function handlePanXChange(value: number) {
    const x = value;
    pan.current = { ...pan.current, x };

    // Update canvas
    updateCanvas();
  }

  function handlePanYChange(value: number) {
    const y = value;
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
  // React.useEffect(() => {
  //   const trackpadGestureHandler = (e: WheelEvent) => {
  //     if (e.ctrlKey) {
  //       handleZoomChange(zoom.current + -e.deltaY / 100);

  //       // Update canvas
  //       updateCanvas();
  //     }
  //   };

  //   window.addEventListener("wheel", trackpadGestureHandler);
  //   return () => {
  //     window.removeEventListener("wheel", trackpadGestureHandler);
  //   };
  // }, []);

  useGesture(
    {
      onDrag: ({ offset: [mx, my] }) => {
        handlePanXChange(mx);
        handlePanYChange(my);

        // Update canvas
        updateCanvas();
      },
      onPinch: ({ offset: [scaleOffset, pinchAngleOffset] }) => {
        handleZoomChange(scaleOffset);
        handleRotationChange(pinchAngleOffset);

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
        className="relative aspect-square w-full touch-none overflow-clip rounded bg-white/10 hover:cursor-move"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
      <form className="mt-6 w-full" onSubmit={handleSubmit}>
        <div className="space-y-2.5">
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <Slider
            ariaLabel="Zoom"
            defaultValue={[zoom.current]}
            min={0.5}
            max={1.5}
            step={0.001}
            onValueChange={([value]) => handleZoomChange(value)}
          />
          <Slider
            ariaLabel="Rotation"
            defaultValue={[rotation.current]}
            min={-180}
            max={180}
            step={1}
            onValueChange={([value]) => handleRotationChange(value)}
          />
          <Slider
            ariaLabel="Pan X"
            defaultValue={[pan.current.x]}
            min={-200}
            max={200}
            step={1}
            onValueChange={([value]) => handlePanXChange(value)}
          />
          <Slider
            ariaLabel="Pan Y"
            defaultValue={[pan.current.y]}
            min={-200}
            max={200}
            step={1}
            onValueChange={([value]) => handlePanYChange(value)}
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
