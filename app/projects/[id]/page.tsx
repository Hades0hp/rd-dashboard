type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">Project Detail</h1>
      <p className="mt-2 text-slate-600">Project ID: {id}</p>
    </main>
  );
}
