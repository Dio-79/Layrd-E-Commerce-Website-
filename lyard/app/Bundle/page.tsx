"use client";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SelectionForms from "./forms-slots";
import BundleBuilder from "./bundlebulider";
import { BundleProvider } from "@/app/context/Bundlecontext";
export default function Page() {
  return (
    <BundleProvider>
        <Header/>
      <BundleBuilder/>
      <Footer/>
    </BundleProvider>
  );
}


      
 