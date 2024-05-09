import React from "react";
import Slider from "./radix-ui/Slider";
import { useGesture } from "@use-gesture/react";
import useMeasure from "react-use-measure";

type Props = {
  // Manipulation props -- State and setters
  zoom?: number;
  setZoom?: React.Dispatch<React.SetStateAction<number>>;
  rotation?: number;
  setRotation?: React.Dispatch<React.SetStateAction<number>>;
  imageSrc?: string;
  setImageSrc?: React.Dispatch<React.SetStateAction<string>>;
  pan?: Vector2;
  setPan?: React.Dispatch<React.SetStateAction<Vector2>>;

  // Cropped image props
  /**
   * Resolution of the cropped image.
   * If not provided, the cropped image will have the same resolution as the source image.
   */
  resolutionPx?: number;

  /**
   * Callback function for when the image is cropped.
   * If not provided, the cropped image will be downloaded.
   * @param croppedImage - The cropped image as a data URL
   */
  onCrop?: (croppedImage: string) => void;
};

interface Vector2 {
  x: number;
  y: number;
}

/**
 * Image cropper component using a div element for rendering.
 * @param resolutionPx - Resolution of the cropped image. If not provided, the cropped image will have the same resolution as the source image.
 * @param onCrop - Callback function for when the image is cropped. If not provided, the cropped image will be downloaded.
 * @param zoom - Zoom level of the image.
 * @param setZoom - Setter for the zoom level.
 * @param rotation - Rotation angle of the image.
 * @param setRotation - Setter for the rotation angle.
 * @param imageSrc - Source image URL.
 * @param setImageSrc - Setter for the source image URL.
 * @param pan - Pan position of the image.
 * @param setPan - Setter for the pan position.
 * @returns JSX.Element
 * @example
 * ```tsx
 * <ImageCropperWithDiv />
 * ```
 * @example
 * ```tsx
 * <ImageCropperWithDiv
 *  resolutionPx={512}
 *  onCrop={(croppedImage) => console.log(croppedImage)}
 * />
 * ```
 */
const ImageCropperWithDiv = ({ resolutionPx, ...props }: Props) => {
  // Refs for canvas and container
  const [canvasContainerRef, canvasContainerDims] = useMeasure();
  const canvasContainerGestureRef = React.useRef<HTMLDivElement | null>(null);

  // Internal state
  const imageState = React.useState<string>("");
  const zoomState = React.useState<number>(1);
  const rotationState = React.useState<number>(0);
  const panState = React.useState<Vector2>({ x: 0, y: 0 });

  // Data state
  // Image state
  const imageSrc = props.imageSrc ?? imageState[0];
  const setImageSrc = props.setImageSrc ?? imageState[1];
  const [imageDimensions, setImageDimensions] = React.useState({
    width: 0,
    height: 0,
  });
  React.useEffect(() => {
    if (!imageSrc) return;

    const image = new Image();
    image.src = imageSrc;
    image.src;
    image.onload = () => {
      console.log("Image loaded", {
        width: image.width,
        height: image.height,
      });
      setImageDimensions({ width: image.width, height: image.height });
    };
  }, [imageSrc]);
  const imageRatio = imageDimensions.width / imageDimensions.height;

  // Zoom state
  const zoom = props.zoom ?? zoomState[0];
  const setZoom = props.setZoom ?? zoomState[1];

  // Rotation state
  const rotation = props.rotation ?? rotationState[0];
  const setRotation = props.setRotation ?? rotationState[1];

  // Pan state
  const pan = props.pan ?? panState[0];
  const setPan = props.setPan ?? panState[1];

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === "string") {
          setImageSrc(dataUrl);

          // Reset transformations
          handlePanXChange(0);
          handleZoomChange(1);
          handleRotationChange(0);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleZoomChange(value: number) {
    const newZoom = Math.max(0.25, value);
    setZoom(newZoom);
  }

  function handleRotationChange(value: number) {
    const newRotation = value;
    setRotation(newRotation);
  }

  function handlePanXChange(value: number) {
    const x = value;
    setPan((prev) => ({ ...prev, x }));
  }

  function handlePanYChange(value: number) {
    const y = value;
    setPan((prev) => ({ ...prev, y }));
  }

  function drawToCanvas() {
    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.style.display = "none"; // Hide canvas
    canvas.style.width = canvasContainerDims.width + "px";
    canvas.style.height = canvasContainerDims.height + "px";

    // Get context
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    // Load image
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const { width, height } = image;

      // Set canvas resolution
      const size = resolutionPx ?? Math.min(width, height);
      canvas.width = size;
      canvas.height = size;

      // Dimensions for cropping the source image (no cropping for now)
      const sWidth = width;
      const sHeight = height;
      const sx = 0;
      const sy = 0;

      // Dimensions for drawing
      // const ratio = sWidth > sHeight ? sHeight / size : sWidth / size;
      const dWidth = sWidth;
      const dHeight = sHeight;
      const dx = -dWidth / 2;
      const dy = -dHeight / 2;

      // Position and rotate image
      // Normalize pan
      const normalizedPan = {
        x: pan.x * (size / canvasContainerDims.width) * zoom,
        y: pan.y * (size / canvasContainerDims.height) * zoom,
      };
      context.translate(size / 2 + normalizedPan.x, size / 2 + normalizedPan.y);
      context.rotate((rotation * Math.PI) / 180);
      context.scale(zoom, zoom);

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

      // Get cropped image
      const croppedImage = canvas.toDataURL("image/png");

      // Call callback if provided
      if (props.onCrop) props.onCrop(croppedImage);
      // Otherwise download image
      else {
        // Callback
        const a = document.createElement("a");
        a.href = croppedImage;
        a.download = "cropped-image.png";
        a.click();
      }

      // Clean up
      canvas.remove();
    };
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Draw image
    drawToCanvas();
  }

  // Gesture handling
  // MacOS Trackpad gestures need to be handled via ref and event listeners; they are not accessible in React
  // React.useEffect(() => {
  //   const trackpadGestureHandler = (e: WheelEvent) => {
  //     if (e.ctrlKey) {
  //       handleZoomChange(zoom.current + -e.deltaY / 100);
  //     }
  //   };

  //   window.addEventListener("wheel", trackpadGestureHandler);
  //   return () => {
  //     window.removeEventListener("wheel", trackpadGestureHandler);
  //   };
  // }, []);
  useGesture(
    {
      onDrag: ({ delta: [mx, my] }) => {
        handlePanXChange(pan.x + mx / zoom);
        handlePanYChange(pan.y + my / zoom);
      },
      onPinch: ({ delta: [scaleOffset, pinchAngleOffset] }) => {
        handleZoomChange(zoom + scaleOffset);
        // handleRotationChange(rotation + pinchAngleOffset);
      },
    },
    {
      target: canvasContainerGestureRef,
    },
  );

  return (
    <>
      {/* Image Preview */}
      <div
        ref={(node) =>
          canvasContainerRef((canvasContainerGestureRef.current = node))
        }
        className="relative flex aspect-square w-full touch-none items-center justify-center overflow-hidden rounded bg-white/10 hover:cursor-move"
      >
        {imageSrc && imageDimensions && canvasContainerDims && imageRatio && (
          <div
            className="absolute"
            style={{
              height:
                imageDimensions.height > imageDimensions.width
                  ? canvasContainerDims.height / imageRatio
                  : "100%",
              width:
                imageDimensions.height > imageDimensions.width
                  ? "100%"
                  : canvasContainerDims.width * imageRatio,
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${pan?.x}px, ${pan?.y}px)`,
            }}
          >
            <img
              src={imageSrc}
              className="pointer-events-none absolute touch-none select-none object-contain"
              style={{}}
            />
          </div>
        )}
      </div>
      <form className="mt-6 w-full" onSubmit={handleSubmit}>
        <div className="space-y-2.5">
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <Slider
            ariaLabel="Zoom"
            defaultValue={[zoom]}
            min={0.5}
            max={1.5}
            step={0.001}
            value={[zoom]}
            onValueChange={([value]) => handleZoomChange(value)}
          />
          <Slider
            ariaLabel="Rotation"
            defaultValue={[rotation]}
            min={-180}
            max={180}
            step={1}
            value={[rotation]}
            onValueChange={([value]) => handleRotationChange(value)}
          />
          <Slider
            ariaLabel="Pan X"
            defaultValue={[pan.x]}
            min={-200}
            max={200}
            step={1}
            value={[pan.x]}
            onValueChange={([value]) => handlePanXChange(value)}
          />
          <Slider
            ariaLabel="Pan Y"
            defaultValue={[pan.y]}
            min={-200}
            max={200}
            step={1}
            value={[pan.y]}
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

export default ImageCropperWithDiv;
