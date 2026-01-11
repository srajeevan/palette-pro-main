-- Create a new storage bucket for reference images
insert into storage.buckets (id, name, public)
values ('reference-images', 'reference-images', true)
on conflict (id) do nothing;

-- Set up RLS policies for the bucket
-- Allow public read access to all images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'reference-images' );

-- Allow authenticated users to upload files to their own folder
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'reference-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
create policy "Authenticated users can delete images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'reference-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
