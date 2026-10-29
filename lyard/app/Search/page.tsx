import { Suspense } from "react";
import SearchResults from "./searchresults";

// useSearchParams() needs a Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}