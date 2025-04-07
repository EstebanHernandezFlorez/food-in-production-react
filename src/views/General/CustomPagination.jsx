import React from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Iconos para prev/next
import '../../CustomPagination.css'; // Importa los estilos para este componente

const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
    // No renderiza nada si solo hay una página o menos
    if (totalPages <= 1) {
        return null;
    }

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePageClick = (pageNumber) => {
        // Solo llama a onPageChange si se hace clic en una página diferente a la actual
        if (pageNumber !== currentPage) {
            onPageChange(pageNumber);
        }
    };

    // Genera un array con los números de página [1, 2, 3, ..., totalPages]
    // NOTA: Para un número MUY grande de páginas, se necesitaría lógica
    // para mostrar elipsis (...) y limitar los números visibles.
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <nav aria-label="Navegación de páginas" className="pagination-container">
            {/* Botón Anterior */}
            <button
                className="pagination-button pagination-arrow"
                onClick={handlePrevious}
                disabled={currentPage === 1} // Deshabilitado si está en la primera página
                aria-label="Página anterior"
            >
                <ChevronLeft size={18} />
            </button>

            {/* Botones de Números de Página */}
            {pageNumbers.map((number) => (
                <button
                    key={number}
                    className={`pagination-button ${number === currentPage ? 'active' : ''}`} // Clase 'active' si es la página actual
                    onClick={() => handlePageClick(number)}
                    aria-current={number === currentPage ? 'page' : undefined} // Mejor accesibilidad
                >
                    {number}
                </button>
            ))}

            {/* Botón Siguiente */}
            <button
                className="pagination-button pagination-arrow"
                onClick={handleNext}
                disabled={currentPage === totalPages} // Deshabilitado si está en la última página
                aria-label="Página siguiente"
            >
                <ChevronRight size={18} />
            </button>
        </nav>
    );
};

// Definición de tipos para las props, ayuda a prevenir errores
CustomPagination.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
};

export default CustomPagination;