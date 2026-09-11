import Image from "next/image";
//import Register from "../components/Register";
import IndexComponent from "../components/index";
export default function Home() {
  return (
    <div className="bg-linear-to-r from-linearyellow via-white to-linearyellow">
    <h1 className="text-primary font-bold text-2xl mb-3">What&apos;s Hot</h1>
    <IndexComponent />
    </div>
  );
}
