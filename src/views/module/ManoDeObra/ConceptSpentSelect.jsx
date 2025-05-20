// ConceptSpentSelect.jsx
import React from 'react';
import { Input } from 'reactstrap'; // Assuming reactstrap Input

const ConceptSpentSelect = ({
    id,                     // HTML id for the select input
    name,                   // Name attribute for the select input (for form handling)
    value,                  // Current selected value
    onChange,               // onChange handler
    optionsList,            // The array of objects to populate the select (e.g., specificConcepts)
    valueField,             // The property name in optionsList objects to use for option's value (e.g., "idSpecificConcept")
    labelField,             // The property name in optionsList objects to use for option's display text (e.g., "name")
    defaultOptionText = "-- Seleccione --", // Text for the default disabled option
    invalid = false,        // Boolean to indicate if the input is invalid
    disabled = false,       // Boolean to disable the input
    bsSize,                 // reactstrap's bsSize prop ('sm', 'lg')
    ...rest                 // Any other props to pass to the reactstrap Input
}) => {
    // Ensure essential props for options are provided
    if (!valueField || !labelField) {
        console.error("ConceptSpentSelect: 'valueField' and 'labelField' props are required.");
        return (
            <Input type="select" disabled invalid>
                <option value="">Error: Configuración incorrecta del select.</option>
            </Input>
        );
    }

    return (
        <Input
            type="select"
            name={name}
            id={id || name} // Use provided id or fallback to name
            value={value}
            onChange={onChange}
            invalid={invalid}
            disabled={disabled || !Array.isArray(optionsList) || optionsList.length === 0} // Disable if no options
            bsSize={bsSize}
            {...rest}
        >
            <option value="">{defaultOptionText}</option>
            {Array.isArray(optionsList) && optionsList.map((option) => {
                // Check if the specified valueField and labelField exist on the option object
                if (option[valueField] === undefined || option[labelField] === undefined) {
                    console.warn(`ConceptSpentSelect: Option object is missing '${valueField}' or '${labelField}'.`, option);
                    return null; // Skip rendering this invalid option
                }
                return (
                    <option
                        key={option[valueField]} // Use the unique ID from your data (specified by valueField)
                        value={option[valueField]}
                    >
                        {option[labelField]} {/* Display text (specified by labelField) */}
                    </option>
                );
            })}
            {Array.isArray(optionsList) && optionsList.length === 0 && !disabled && (
                <option value="" disabled>No hay opciones disponibles</option>
            )}
        </Input>
    );
};

export default ConceptSpentSelect;