import React from "react";
import ImageCropperWithCanvas from "./ImageCropperWithCanvas";
import ImageCropperWithDiv from "./ImageCropperWithDiv";

type Props = {};

const App = (props: Props) => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-500">
      <div className="flex items-center justify-center space-x-8">
        {/* <div className="relative w-96 rounded-md bg-slate-900 p-4 text-white">
          <ImageCropperWithCanvas />
        </div> */}

        <div className="relative w-96 rounded-md bg-slate-900 p-4 text-white">
          <ImageCropperWithDiv />
        </div>
      </div>
    </div>
  );
};

export default App;
