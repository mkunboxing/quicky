import About from "./_components/about";
import Footer from "./_components/footer";
import Header from "./_components/header";
import Hero from "./_components/hero";
import NewsLetter from "./_components/newsletter";
import Products from "./_components/products";
import SpecialProducts from "./_components/specialProducts";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <SpecialProducts />
      <Products />
      <About />
      <NewsLetter />
      <Footer />
    </>
  );
}
