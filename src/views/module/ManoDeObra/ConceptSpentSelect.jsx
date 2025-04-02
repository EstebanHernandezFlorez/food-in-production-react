// Inside ConceptSpentSelect.jsx (Example structure)
import React from 'react';
import { Input, Label } from 'reactstrap'; // Assuming reactstrap Input

const ConceptSpentSelect = ({ value, onChange, conceptSpents, name, invalid, id, ...rest }) => {
    return (
        // Removed FormGroup from here as it's likely in the parent
        <>
          {/* Removed Label as it's likely in the parent */}
          <Input
            type="select"
            name={name || "idConceptSpent"} // Use passed name or default
            id={id || name || "idConceptSpent"} // Use passed id or name or default
            value={value}
            onChange={onChange}
            invalid={invalid}
            {...rest} // Pass other props like style, etc.
          >
            <option value="">-- Seleccione Concepto --</option>
            {/* Ensure conceptSpents is an array before mapping */}
            {Array.isArray(conceptSpents) && conceptSpents.map((concept) => (
              <option
                // **** ADD THE KEY PROP HERE ****
                key={concept.idExpenseType} // Use the unique ID from your data
                value={concept.idExpenseType}
              >
                {concept.name} {/* Display the concept name */}
              </option>
            ))}
          </Input>
        </>
    );
};

export default ConceptSpentSelect;