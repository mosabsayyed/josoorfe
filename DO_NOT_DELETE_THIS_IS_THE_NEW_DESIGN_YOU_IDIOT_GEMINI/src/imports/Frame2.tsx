import imgObject from "figma:asset/317546937a0d464f99bf7a8647253780400d4077.png";
import imgRectangle from "figma:asset/e5696f7f5d86f2cf38fa9b450ae07bceff40166d.png";

export default function Frame() {
  return (
    <div className="relative size-full">
      <div className="absolute h-[1105px] left-0 top-0 w-[1336px]" data-name="Object">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[103.41%] left-[-1.17%] max-w-none top-[-1.4%] w-[102.18%]" src={imgObject} />
        </div>
      </div>
      <div className="absolute h-[1105px] left-0 top-0 w-[1290px]" data-name="Rectangle">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[132.56%] left-0 max-w-none top-[-13.06%] w-full" src={imgRectangle} />
        </div>
      </div>
    </div>
  );
}