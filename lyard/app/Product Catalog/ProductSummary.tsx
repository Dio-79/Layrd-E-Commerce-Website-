type ProductSummaryProps = {
  name: string;
  tagline: string;
  /** Already formatted, e.g. "$9.00". */
  price: string;
  description: string;
};

export default function ProductSummary({ name, tagline, price, description }: ProductSummaryProps) {
  return (
    <div>
      <h1 className="text-display uppercase text-foreground max-md:text-4xl">{name}</h1>
      <p className="mt-2 text-tagline text-muted">{tagline}</p>
      {/* Gold on white is 2.1:1 — keep the price at this size and weight. */}
      <p className="mt-2 border-b border-gold pb-2 text-price text-gold">{price}</p>
      <p className="mt-3 text-body text-foreground">{description}</p>
    </div>
  );
}
