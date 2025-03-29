// src/components/ConceptSpentSelect.jsx
import React, { useState, useEffect } from 'react';
import { Input, FormGroup, Label } from 'reactstrap';

const ConceptSpentSelect = ({ value, onChange, conceptSpents }) => {
    return (
        <FormGroup>
            <Label>Concepto de Gasto</Label>
            <Input
                type="select"
                name="idConceptSpent"
                value={value || ''}  // Use value prop, provide a default
                onChange={onChange}    // Use onChange prop
                style={{ border: '1px solid #ced4da' }}
            >
                <option value="">Seleccionar Concepto</option>
                {conceptSpents && conceptSpents.map(concept => (
                    <option key={concept.idConceptSpent} value={concept.idConceptSpent}>
                        {concept.name}
                    </option>
                ))}
            </Input>
        </FormGroup>
    );
};

export default ConceptSpentSelect;