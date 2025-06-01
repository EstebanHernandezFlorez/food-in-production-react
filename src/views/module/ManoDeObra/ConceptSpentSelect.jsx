// src/components/ManoDeObra/ConceptSpentSelect.jsx
import React from 'react';
import { Input, Spinner, FormText } from 'reactstrap';

const ConceptSpentSelect = ({
    id,
    name,
    selectedValue, // Cambiado de 'value' a 'selectedValue' para evitar confusión con el value del input
    onChange: onConceptSelected, // Renombrado para claridad, espera el objeto concepto
    allSpecificConcepts, // Lista completa de conceptos específicos
    expenseCategories,   // Lista de todas las categorías para buscar nombres
    isLoading,           // Para mostrar un spinner mientras cargan los conceptos
    defaultOptionText = "Seleccione un concepto...",
    disabled = false,
    invalid = false,
    bsSize,
    // valueField y labelField son menos necesarios si trabajamos directamente con la estructura de allSpecificConcepts
    // pero se mantienen por si tu estructura de concepto es muy variable.
    valueField = "idSpecificConcept",
    labelField = "name",
    ...rest
}) => {
    if (!Array.isArray(allSpecificConcepts)) {
        console.error("ConceptSpentSelect: 'allSpecificConcepts' prop debe ser un array.");
        return <Input type="select" disabled invalid><option>Error: Datos de conceptos inválidos.</option></Input>;
    }

    const handleChange = (event) => {
        const selectedId = event.target.value;
        if (!selectedId) {
            onConceptSelected(null); // Pasar null si se deselecciona (opción "Seleccione...")
            return;
        }
        // Encontrar el objeto concepto completo basado en el ID seleccionado
        const selectedConceptObject = allSpecificConcepts.find(
            (concept) => String(concept[valueField]) === selectedId
        );
        onConceptSelected(selectedConceptObject || null);
    };

    const getDisplayLabel = (concept) => {
        let label = concept[labelField] || 'Concepto sin nombre';
        // Intentar encontrar y añadir el nombre de la categoría
        // Asumiendo que el concepto tiene `idExpenseCategory` o `categoryDetails.idExpenseCategory`
        const categoryId = concept.idExpenseCategory || concept.categoryDetails?.idExpenseCategory;
        if (categoryId && Array.isArray(expenseCategories)) {
            const category = expenseCategories.find(cat => cat.idExpenseCategory === categoryId);
            if (category && category.name) {
                label += ` (${category.name})`;
            }
        }
        return label;
    };

    let currentInputValue = '';
    if (selectedValue && selectedValue[valueField] !== undefined) {
        currentInputValue = selectedValue[valueField].toString();
    }


    return (
        <>
            <Input
                type="select"
                name={name}
                id={id || name}
                value={currentInputValue} // El valor del input debe ser el ID del concepto seleccionado
                onChange={handleChange}
                invalid={invalid}
                disabled={disabled || isLoading || allSpecificConcepts.length === 0}
                bsSize={bsSize}
                {...rest}
            >
                <option value="">
                    {isLoading ? "Cargando conceptos..." :
                     allSpecificConcepts.length === 0 ? "No hay conceptos disponibles" :
                     defaultOptionText
                    }
                </option>
                {allSpecificConcepts.map((option) => {
                    if (option[valueField] === undefined || option[labelField] === undefined) {
                        console.warn(`ConceptSpentSelect: El objeto opción no tiene '${valueField}' o '${labelField}'.`, option);
                        return null;
                    }
                    return (
                        <option
                            key={option[valueField]}
                            value={option[valueField]}
                        >
                            {getDisplayLabel(option)}
                        </option>
                    );
                })}
            </Input>
            {isLoading && <Spinner size="sm" className="ms-2 align-middle" />}
            {!isLoading && allSpecificConcepts.length === 0 && !disabled && (
                 <FormText color="muted">No hay conceptos específicos configurados. Diríjase a "Configurar Gastos".</FormText>
            )}
        </>
    );
};

export default ConceptSpentSelect;