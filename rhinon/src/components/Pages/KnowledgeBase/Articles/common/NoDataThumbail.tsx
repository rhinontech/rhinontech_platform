import Image from "next/image";
import images from "@/components/Constants/Images";

export default function NoDataThumbail() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 pb-0">
      <div className="flex w-full p-5 rounded-lg bg-gradient-to-r from-transparent to-secondary h-[300px]">
        <div className="flex-1 flex flex-col gap-[12px] justify-center items-start">
          <p className="font-semibold text-2xl">
            Share Your Insights And Discover More
          </p>
          <p className="text-base text-muted-foreground">
            Browse step-by-step instructions, frequently asked questions, and
            expert advice to get started or solve problems. All your questions
            are answered in one spot.
          </p>
        </div>
        <div className="flex-shrink-0 flex gap-[9px]">
          <Image src={images.knowledgeBase} width={235} height={203} alt={""} />
        </div>
      </div>
    </div>
  );
}
