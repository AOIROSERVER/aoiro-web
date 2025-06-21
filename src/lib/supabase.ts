import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqxadmvnsusscsudrmqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxeGFkbXZuc3Vzc2NzdWRybXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNTUyMjMsImV4cCI6MjA2NTkzMTIyM30.XfQ5KyRUR_9o9PfvySjud0YW-BwHH87jUSX_Em1_F54';

export const supabase = createClient(supabaseUrl, supabaseKey);