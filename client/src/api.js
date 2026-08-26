import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Dashboard
  getDashboardSummary: () => axios.get(`${API_BASE}/dashboard/summary`).then((res) => res.data),

  // Services
  getServices: () => axios.get(`${API_BASE}/services`).then((res) => res.data),
  getServiceById: (id) => axios.get(`${API_BASE}/services/${id}`).then((res) => res.data),
  createService: (data) => axios.post(`${API_BASE}/services`, data).then((res) => res.data),
  updateService: (id, data) => axios.put(`${API_BASE}/services/${id}`, data).then((res) => res.data),
  deleteService: (id) => axios.delete(`${API_BASE}/services/${id}`).then((res) => res.data),

  // Dependencies
  getDependencies: () => axios.get(`${API_BASE}/dependencies`).then((res) => res.data),
  createDependency: (data) => axios.post(`${API_BASE}/dependencies`, data).then((res) => res.data),
  deleteDependency: (id) => axios.delete(`${API_BASE}/dependencies/${id}`).then((res) => res.data),

  // Topology
  getFullTopology: () => axios.get(`${API_BASE}/topology`).then((res) => res.data),
  getServiceTopology: (serviceId) => axios.get(`${API_BASE}/topology/${serviceId}`).then((res) => res.data),

  // Simulation
  runSimulation: (data) => axios.post(`${API_BASE}/simulations/run`, data).then((res) => res.data),
  getSimulationHistory: (params) => axios.get(`${API_BASE}/simulations/history`, { params }).then((res) => res.data),
  getSimulationDetails: (id) => axios.get(`${API_BASE}/simulations/${id}`).then((res) => res.data),
  clearSimulationHistory: () => axios.delete(`${API_BASE}/simulations/history`).then((res) => res.data),

  // Seed
  seedData: () => axios.post(`${API_BASE}/seed`).then((res) => res.data),
};
