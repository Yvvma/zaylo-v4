export default function BlogCard({ title, description, image, slug, type, por, data }) {
  return (
    <a href={`/blog/${slug}`} className="group block h-full">
      <div className="rounded-xl bg-white transition-all duration-300 h-full flex flex-col">
        <div className="flex flex-row">
          <div className="flex flex-row bg-[black]">
            <h4 className="font-blog font-medium px-2 text-white tracking-tight">{type}</h4>
          </div>
          <div className="h-[3px] bg-black w-full" />
        </div>

        <div className="flex flex-col p-4 flex-1">
          <h2 className="text-black font-blog font-medium text-2xl mb-3">{title}</h2>
          <p className="text-black font-blog">{description}</p>
          <div className="flex flex-row gap-2 mt-auto pt-4">
            <p className="text-black font-blog font-medium text-sm">Post por {por}</p>
            <p className="text-black font-blog text-sm">{data}</p>
          </div>
        </div>
        <img src={image} className="w-full aspect-[4/3] object-cover" alt="" />
      </div>
    </a>
  );
}
