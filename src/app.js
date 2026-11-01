// Shared behaviour: highlight-carousel paddles. Page widgets live inline on each page.
(function () {
  document.querySelectorAll("[data-carousel]").forEach(function (box) {
    var track = box.querySelector(".hl-track");
    var prev = box.querySelector(".paddle.prev");
    var next = box.querySelector(".paddle.next");
    if (!track || !prev || !next) return;
    function step() {
      var card = track.querySelector(".hl-card");
      return card ? card.getBoundingClientRect().width + 20 : 300;
    }
    function sync() {
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
    }
    var smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: smooth }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: smooth }); });
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });
})();
