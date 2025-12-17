import { PrivateAxios } from "@/helpers/PrivateAxios";

// Fetch all pipelines inside a view
export const getPipelineWithLead = async (view_id: number) => {
  try {
    const response = await PrivateAxios.get(
      `/crm/pipelines/view/${view_id}/pipelines`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch kanban data (stages + entities)
export const getPipelineKanban = async (pipeline_id: number) => {
  try {
    const response = await PrivateAxios.get(
      `/crm/pipelines/pipeline/${pipeline_id}/kanban`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update pipeline and stages
export const updatePipeline = async (pipeline_id: number, payload: any) => {
  try {
    const response = await PrivateAxios.put(
      `/crm/pipelines/pipeline/${pipeline_id}`,
      payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reorder stages
export const reorderStages = async (pipeline_id: number, stages: any[]) => {
  try {
    const response = await PrivateAxios.patch(
      `/crm/pipelines/pipeline/${pipeline_id}/reorder`,
      { stages }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete stage
export const deleteStage = async (pipeline_id: number, stage_id: number) => {
  try {
    const response = await PrivateAxios.delete(
      `/crm/pipelines/pipeline/${pipeline_id}/stage/${stage_id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const moveEntityStageService = async (
  entity_type: "people" | "company" | "deal" | "default_customers",
  entity_id: number,
  to_stage_id: number,
  pipeline_id: number
) => {
  try {
    const response = await PrivateAxios.post(
      `/crm/pipelines/entity/${entity_type}/${entity_id}/move`,
      { to_stage_id, pipeline_id }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteEntityService = async (
  entityType: "people" | "company" | "deal" | "default_customers",
  entityId: number,
  pipelineId: number
) => {
  try {
    const response = await PrivateAxios.delete(
      `/crm/pipelines/entity/${entityType}/${entityId}`,
      {
        data: { pipeline_id: pipelineId },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get entity's current pipelines
export const getEntityPipelines = async (
  entityType: "people" | "company" | "deal" | "default_customers",
  entityId: number
) => {
  try {
    const response = await PrivateAxios.get(
      `/crm/pipelines/entity/${entityType}/${entityId}/pipelines`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
