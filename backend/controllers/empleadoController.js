import * as empleadoService from '../services/empleadoService.js';

export function getAll(req, res) {
  try {
    const empleados = empleadoService.getAllEmpleados();
    res.json(empleados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function getById(req, res) {
  try {
    const empleado = empleadoService.getEmpleadoById(req.params.id);
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(empleado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function getByCodigo(req, res) {
  try {
    const empleado = empleadoService.getEmpleadoByCodigo(req.params.codigo);
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(empleado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function create(req, res) {
  try {
    const { codigo, nombre } = req.body;
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }
    
    const existing = empleadoService.getEmpleadoByCodigo(codigo);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un empleado con ese código' });
    }

    const empleado = empleadoService.createEmpleado(codigo, nombre);
    res.status(201).json(empleado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function update(req, res) {
  try {
    const { codigo, nombre } = req.body;
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }

    const existing = empleadoService.getEmpleadoById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const empleado = empleadoService.updateEmpleado(req.params.id, codigo, nombre);
    res.json(empleado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function remove(req, res) {
  try {
    const existing = empleadoService.getEmpleadoById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    empleadoService.deleteEmpleado(req.params.id);
    res.json({ success: true, mensaje: 'Empleado desactivado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
