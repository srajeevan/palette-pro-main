-- Create a public storage bucket for reference images
insert into storage.buckets (id, name, public)
values ('reference-images', 'reference-images', true);

-- Policy to allow authenticated users to upload images to their own folder
create policy "Authenticated users can upload reference images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'reference-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow public access to view reference images
create policy "Public can view reference images"
on storage.objects for select
to public
using ( bucket_id = 'reference-images' );