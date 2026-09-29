-- Public company name only. Shipments, events, users, and addresses are untouched.
update company_settings
set
  company_name = 'QCORVAZENT',
  tagline = case
    when tagline is null
      or btrim(tagline) = ''
      or tagline = 'Moving what matters. Across borders. With confidence.'
    then 'International Courier & Express'
    else tagline
  end
where company_name ilike 'NKDON%';
