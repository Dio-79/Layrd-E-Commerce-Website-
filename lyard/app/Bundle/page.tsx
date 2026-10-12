"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SelectionForms from "./forms-slots";
import Calculation from "./calculation";
import Button from "./button";

export default function MixAndMatchBundlePage() {


  return (
    <>
      <Header />
  <Button/>
     <Calculation/>
    <SelectionForms/>

      <Footer />
    </>
  );
}