"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SelectionForms from "./forms-slots";

import { BundleProvider } from "@/app/context/Bundlecontext";
import BundleBuilder from "./bundlebulider";

export default function Page() {
  return (
    <BundleProvider>
        <Header/>

      <BundleBuilder/>
      <SelectionForms/>
      <Footer/>
    </BundleProvider>
  );
}


      
 