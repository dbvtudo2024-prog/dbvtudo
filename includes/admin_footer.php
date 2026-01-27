        </main>
    </div>
    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> <?php echo SITE_NAME; ?> - Painel Administrativo</p>
        </div>
    </footer>
    <button id="backToTop" class="back-to-top" aria-label="Voltar ao topo">
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4l-6 6h4v8h4v-8h4l-6-6z"></path>
        </svg>
    </button>
    <script>
    (function(){
        var btn = document.getElementById('backToTop');
        if (!btn) return;
        var showAt = 100;
        function currentScroll() {
            return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        }
        function toggle() {
            if (currentScroll() > showAt) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.style.transform = 'translateY(0)';
            } else {
                btn.style.opacity = '0';
                btn.style.pointerEvents = 'none';
                btn.style.transform = 'translateY(10px)';
            }
        }
        ['scroll','wheel','touchmove','resize'].forEach(function(ev){ window.addEventListener(ev, toggle, {passive:true}); });
        document.addEventListener('DOMContentLoaded', toggle);
        window.addEventListener('load', toggle);
        btn.addEventListener('click', function(){
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    })();
    (function(){
        var menuBtn = document.getElementById('adminMenuBtn');
        var sidebar = document.querySelector('.sidebar');
        var overlay = document.getElementById('sidebarOverlay');
        function updateMobileMode(){
            var w = window.innerWidth || document.documentElement.clientWidth;
            var isMobile = w <= 768;
            document.body.classList.toggle('admin-mobile', isMobile);
            document.body.classList.toggle('admin-narrow', w <= 480);
            if (!isMobile) {
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
                document.body.classList.remove('admin-sidebar-open');
            }
        }
        updateMobileMode();
        window.addEventListener('resize', updateMobileMode, {passive:true});
        if (menuBtn && sidebar) {
            menuBtn.addEventListener('click', function(){
                sidebar.classList.toggle('open');
                if (overlay) overlay.classList.toggle('active');
                document.body.classList.toggle('admin-sidebar-open');
            });
        }
        if (overlay) {
            overlay.addEventListener('click', function(){
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                document.body.classList.remove('admin-sidebar-open');
            });
        }
        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
                document.body.classList.remove('admin-sidebar-open');
            }
        });
    })();
    </script>
</body>
</html>
