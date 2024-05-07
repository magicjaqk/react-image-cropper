import React from "react";
import * as RadixSlider from "@radix-ui/react-slider";

interface Props extends React.ComponentProps<typeof RadixSlider.Root> {
  ariaLabel: string;
}

export const Slider = React.forwardRef<HTMLSpanElement, Props>(
  ({ ariaLabel, ...props }, ref) => (
    <RadixSlider.Root
      ref={ref}
      className="relative flex h-5 w-full touch-none select-none items-center"
      {...props}
    >
      <RadixSlider.Track className="bg-blackA7 relative h-[3px] grow rounded-full bg-white/10">
        <RadixSlider.Range className="absolute h-full rounded-full bg-white" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="shadow-blackA4 hover:bg-violet3 focus:shadow-blackA5 block h-5 w-5 rounded-[10px] bg-white focus:outline-none"
        aria-label={ariaLabel}
      />
    </RadixSlider.Root>
  ),
);

export default Slider;
