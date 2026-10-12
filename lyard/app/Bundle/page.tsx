"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SelectionForms from "./forms-slots";

import { BundleProvider } from "@/app/context/Bundlecontext";
import bunld
export default function Page() {
  return (
    <BundleProvider>
        <Header/>

      <BundleBuilder/>
      <Footer/>
    </BundleProvider>
  );
}


      
 