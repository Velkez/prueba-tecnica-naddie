/**
 * NADDIE - Modal Controller
 * Simplified version - Welcome modal tutorial
 */

class ModalController {
    constructor() {
        this.modal = document.getElementById('welcome-modal');
        this.slides = document.querySelectorAll('.slide');
        this.dots = document.querySelectorAll('.slide-dot');
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;
        this.isModalOpen = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showSlide(0);
    }

    setupEventListeners() {
        const closeBtn = document.getElementById('modal-close');
        const nextBtn = document.getElementById('modal-next');
        const prevBtn = document.getElementById('modal-prev');
        const startBtn = document.getElementById('modal-start');

        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
        if (startBtn) startBtn.addEventListener('click', () => this.close());

        this.dots.forEach((dot) => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                this.showSlide(index);
            });
        });

        // Close on outside click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
        
        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                this.close();
            }
            if (e.key === 'ArrowRight' && this.isModalOpen) {
                this.nextSlide();
            }
            if (e.key === 'ArrowLeft' && this.isModalOpen) {
                this.prevSlide();
            }
        });
    }

    updateButtons() {
        const nextBtn = document.getElementById('modal-next');
        const prevBtn = document.getElementById('modal-prev');
        const startBtn = document.getElementById('modal-start');

        if (prevBtn) {
            prevBtn.hidden = this.currentSlide === 0;
        }

        if (this.currentSlide === this.totalSlides - 1) {
            if (nextBtn) nextBtn.hidden = true;
            if (startBtn) startBtn.hidden = false;
        } else {
            if (nextBtn) nextBtn.hidden = false;
            if (startBtn) startBtn.hidden = true;
        }
    }

    showSlide(index) {
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.dots.forEach(dot => dot.classList.remove('active'));

        const slide = this.slides[index];
        const dot = this.dots[index];

        if (slide) slide.classList.add('active');
        if (dot) dot.classList.add('active');

        this.currentSlide = index;
        this.updateButtons();
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.showSlide(nextIndex);
    }

    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.showSlide(prevIndex);
    }

    open() {
        this.isModalOpen = true;
        if (this.modal) {
            this.modal.classList.remove('hidden');
        }
    }

    close() {
        this.isModalOpen = false;
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    }
}

export default ModalController;
