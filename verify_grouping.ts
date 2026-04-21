
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://qfpyjavbncijowjvznkg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc');

async function check() {
  const { data } = await supabase.from('Cultura').select('uniformes_list').eq('club_type', 'PATHFINDER').single();
  if (data) {
    console.log('--- ESTRUTURA FINAL ---');
    data.uniformes_list.forEach((item: any) => {
      console.log(`- ${item.titulo} (${item.subitems?.length || 0} subitems)`);
      if (item.titulo === 'Uniforme de Gala') {
         item.subitems.forEach((s: any) => console.log(`   > ${s.titulo}`));
      }
    });
  }
}
check();
