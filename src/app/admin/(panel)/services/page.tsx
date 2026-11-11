import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATS } from "@/lib/directory";
import { photoLibrary } from "../businesses/library";
import { PageHeader } from "../ui";
import { CategoryPicker, ServicesManager } from "./ServicesManager";

type SP = Promise<{ cat?: string }>;

/** Manage the services (sub-categories) inside each category (issue #26). */
export default async function Services({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const cats = CATS.filter((c) => c.key !== "emergency");
  const cat = cats.find((c) => c.key === sp.cat) ?? cats[0];
  const [rows, library] = await Promise.all([
    db.service.findMany({ where: { category: cat.key }, orderBy: [{ position: "asc" }, { name: "asc" }], include: { _count: { select: { businesses: true } } } }),
    photoLibrary(),
  ]);

  return (
    <>
      <PageHeader title="Services" sub="The services inside each category. Visitors choose a category, then a service, then a business." />
      <CategoryPicker cats={cats.map((c) => ({ value: c.key, label: c.name }))} value={cat.key} />
      <ServicesManager
        key={cat.key}
        category={{ key: cat.key, name: cat.name }}
        library={library}
        services={rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, description: r.description, image: r.image, visible: r.visible, count: r._count.businesses }))}
      />
    </>
  );
}
