
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qfpyjavbncijowjvznkg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data } = await supabase
    .from('Cultura')
    .select('uniformes_list')
    .eq('club_type', 'PATHFINDER')
    .single();

  if (data && data.uniformes_list) {
    data.uniformes_list.forEach((item: any) => {
      console.log(`Cat: ${item.titulo}`);
      if (item.blocks.length > 0) console.log(`  - Main Blocks: ${item.blocks.length}`);
      if (item.subitems.length > 0) {
        item.subitems.forEach((s: any) => {
          console.log(`    - Subitem: ${s.titulo} (${s.blocks.length} blocks)`);
        });
      }
    });
  }
}
check();
