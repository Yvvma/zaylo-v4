import { CartProvider } from "../Shop/CartContext";
import ProductCard from "../Shop/ProductCard";
import { products } from "../../data/products";

export default function PostPage({ post }) {
  return (
    <>
      <div className="relative  p-4  pt-16 flex flex-col gap-8 bg-[#131819]/20 justify-center items-center">
        

        <div className="flex flex-col gap-2 py-2 max-w-4xl justify-start items-start w-full">
          <nav className="flex gap-2 text-xs text-white/60 font-blog">
            <a href="/" className="hover:text-white transition">Início</a>
            <span>/</span>
            <a href="/blog" className="hover:text-white transition">Blog</a>
            <span>/</span>
            <span className="text-white/80">{post.data.title}</span>
          </nav>
          <h1 className="text-2xl font-blog font-bold text-white">{post.data.title}</h1>
          <p className="text-lg text-white/80 font-blog font-light">{post.data.description}</p>

          <div className="flex flex-row gap-4">
            <p className="text-white font-blog font-medium text-sm">Post por {post.data.por}</p>
            <p className="text-white font-blog text-sm">{post.data.data}</p>
          </div>
          <img src={post.data.cover} className="w-full rounded-xl max-w-4xl" alt="" />
        </div>

        <div className="flex flex-col w-full justify-center items-center">
        <article className="prose prose-lg  font-blog font-light text-white [&_h2]:py-2 [&_p]:mb-6
         max-w-4xl [&_table]:w-full [&_table]:border-collapse [&_th]:border
          [&_th]:border-white/20  [&_th]:text-left [&_td]:border [&_td]:border-white/20 
          [&_td]:p-2 [&_ul]:list-disc [&_ul]:pl-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:font-bold [&_h4]:text-xl [&_h4]:font-bold [&_h4]:mt-6 [&_h4]:mb-2" 
          dangerouslySetInnerHTML={{ __html: post.rendered.html }}>
        </article>
        </div>

        <div className="flex flex-col gap-4 ">
          <div className="flex flex-col gap-2 justify-center items-center">
            <h4 className="font-blog font-bold text-black tracking-tight bg-white px-2">Link da matéria:</h4>
            <a href={post.data.materia} className="text-white font-blog font-light text-sm">
              {post.data.brand}
            </a>
          </div>

          <div className="flex flex-col justify-center items-center gap-2">
            <h4 className="font-blog font-bold text-black tracking-tight bg-white px-2">Redes Sociais:</h4>
            <a href={post.data.socials} className="text-white font-blog font-light text-sm">
              {post.data.insta}
            </a>
          </div>
        </div>
      </div>

      <section className="w-full max-w-4xl sm:max-w-max sm:px-32">
        <h2 className="text-xl font-blog font-medium text-white mb-4 px-4">Produtos Zaylo</h2>
        <CartProvider>
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-6 p-2 pb-8">
            {products.map((product) => (
              <div key={product.id} className="[&_*]:!text-white [&_.z-30]:!hidden">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </CartProvider>
      </section>
    </>
  );
}
