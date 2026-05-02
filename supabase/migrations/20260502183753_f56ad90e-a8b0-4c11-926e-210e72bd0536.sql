revoke execute on function public.user_owns_template(uuid, text, text) from public, anon, authenticated;
grant execute on function public.user_owns_template(uuid, text, text) to service_role;