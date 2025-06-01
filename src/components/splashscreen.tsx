import Image from "next/image";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-white z-[99999] flex items-center justify-center p-4">
      <Image
        src="/aju.jpg"
        alt="Logo"
        width={150}
        height={100}
        quality={100}
        className="object-cover animate-pulse"
      />
    </div>
  );
}
