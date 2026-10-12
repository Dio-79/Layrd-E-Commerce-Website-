"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SelectionForms from "./forms-slots";
import Calculation from "./calculation";
import Button from "./button";

import { BundleProvider } from "@/app/context/Bundlecontext";

export default function Page() {
  return (
    <BundleProvider>
        <Header/>

      <Button />
      <Calculation />
      <SelectionForms/>
      <Footer/>
    </BundleProvider>
  );
}


      
 