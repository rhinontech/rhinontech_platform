const { views } = require("../../models/crm_models/crmdb");

// GET Table Columns
const getTableColumns = async (req, res) => {
  const { view_id } = req.params;

  try {
    const view = await views.findOne({ where: { id: view_id } });

    if (!view) return res.status(404).json({ message: "View not found" });

    return res.status(200).json({
      table_columns: view.table_columns || [],
      view_manage_type: view.view_manage_type,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE All Columns (replace full array)
const updateTableColumns = async (req, res) => {
  const { view_id } = req.params;
  const { table_columns } = req.body;

  try {
    await views.update({ table_columns }, { where: { id: view_id } });

    return res.status(200).json({
      message: "Table columns updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// ADD Column
const addTableColumn = async (req, res) => {
  const { view_id } = req.params;
  const { key, label, visible = true, width = 150 } = req.body;

  try {
    const view = await views.findOne({ where: { id: view_id } });

    if (!view) return res.status(404).json({ message: "View not found" });

    const updated = [...view.table_columns, { key, label, visible, width }];

    await views.update({ table_columns: updated }, { where: { id: view_id } });

    return res.status(201).json({
      message: "Column added successfully",
      table_columns: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// DELETE Column
const deleteTableColumn = async (req, res) => {
  const { view_id, key } = req.params;

  try {
    const view = await views.findOne({ where: { id: view_id } });

    if (!view) return res.status(404).json({ message: "View not found" });

    const updated = view.table_columns.filter((col) => col.key !== key);

    await views.update({ table_columns: updated }, { where: { id: view_id } });

    return res.status(200).json({
      message: "Column deleted successfully",
      table_columns: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// REORDER Columns
const reorderTableColumns = async (req, res) => {
  const { view_id } = req.params;
  const { newOrder } = req.body; // array of keys

  try {
    const view = await views.findOne({ where: { id: view_id } });

    if (!view) return res.status(404).json({ message: "View not found" });

    const reordered = newOrder
      .map((key) => view.table_columns.find((col) => col.key === key))
      .filter(Boolean);

    await views.update(
      { table_columns: reordered },
      { where: { id: view_id } }
    );

    return res.status(200).json({
      message: "Table columns reordered successfully",
      table_columns: reordered,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// TOGGLE Column Visibility
const toggleColumnVisibility = async (req, res) => {
  const { view_id, key } = req.params;

  try {
    const view = await views.findOne({ where: { id: view_id } });

    if (!view) return res.status(404).json({ message: "View not found" });

    const updated = view.table_columns.map((col) =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );

    await views.update({ table_columns: updated }, { where: { id: view_id } });

    return res.status(200).json({
      message: "Visibility updated successfully",
      table_columns: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// RENAME Column
const renameTableColumn = async (req, res) => {
  const { view_id, key } = req.params;
  const { newLabel } = req.body;

  try {
    const view = await views.findOne({ where: { id: view_id } });

    if (!view) return res.status(404).json({ message: "View not found" });

    const updated = view.table_columns.map((col) =>
      col.key === key ? { ...col, label: newLabel } : col
    );

    await views.update({ table_columns: updated }, { where: { id: view_id } });

    return res.status(200).json({
      message: "Column renamed successfully",
      table_columns: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  getTableColumns,
  updateTableColumns,
  addTableColumn,
  deleteTableColumn,
  reorderTableColumns,
  toggleColumnVisibility,
  renameTableColumn,
};
