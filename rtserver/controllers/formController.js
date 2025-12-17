const { forms, customers, chatbots } = require("../models");
const { logActivity } = require("../utils/activityLogger");

const getForms = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { chatbot_id } = req.query;

    const formConfig = await forms.findOne({
      where: { chatbot_id, organization_id },
    });

    if (!formConfig) {
      return res.status(404).json({ message: "Form configuration not found" });
    }

    return res.json(formConfig);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateForms = async (req, res) => {
  try {
    const { organization_id, user_id } = req.user;
    const { chatbot_id } = req.query;
    const { ticket_form, pre_chat_form, post_chat_form } = req.body;

    let formConfig = await forms.findOne({
      where: { chatbot_id, organization_id },
    });

    if (!formConfig) {
      // Create new form configuration
      formConfig = await forms.create({
        organization_id,
        chatbot_id, //  add chatbot_id on create
        ticket_form: ticket_form || [],
        pre_chat_form: pre_chat_form || {},
        post_chat_form: post_chat_form || {},
      });

      //log activity
      logActivity(user_id, organization_id, "FORMS", "Updated the forms", {
        ticket_form,
        pre_chat_form,
        post_chat_form,
      });
      return res
        .status(201)
        .json({ message: "Form configuration created", data: formConfig });
    }

    // Update existing form configuration
    formConfig.ticket_form = ticket_form ?? formConfig.ticket_form;
    formConfig.pre_chat_form = pre_chat_form ?? formConfig.pre_chat_form;
    formConfig.post_chat_form = post_chat_form ?? formConfig.post_chat_form;

    await formConfig.save();

    //log activity
    logActivity(user_id, organization_id, "FORMS", "Updated the forms", {
      ticket_form,
      pre_chat_form,
      post_chat_form,
    });
    return res.json({
      message: "Form configuration updated",
      data: formConfig,
    });
  } catch (error) {
    console.error("Error in updateForms:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getFormsForChstbot = async (req, res) => {
  try {
    const { chatbot_id } = req.query;

    const formConfig = await forms.findOne({
      where: { chatbot_id },
    });

    if (!formConfig) {
      return res.status(404).json({ message: "Form configuration not found" });
    }

    return res.json(formConfig);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const saveCustomerDetailsFromPreChatForm = async (req, res) => {
  const { email, custom_data, chatbot_id } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Find customer by email
    let customer = await customers.findOne({ where: { email } });

    const chatbot = await chatbots.findOne({
      where: { chatbot_id },
    });
    if (customer) {
      // Update existing customer's custom_data (merge with old one)
      const updatedCustomData = {
        ...customer.custom_data,
        ...custom_data,
      };

      await customer.update({ custom_data: updatedCustomData });

      return res.json({
        message: "Customer updated successfully",
        customer,
      });
    } else {
      //  Create new customer
      customer = await customers.create({
        email,
        organization_id: chatbot.organization_id, // must be passed in req.body
        custom_data,
      });

      return res.json({
        message: "Customer created successfully",
        customer,
      });
    }
  } catch (error) {
    console.error("Error saving customer:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getForms,
  updateForms,
  getFormsForChstbot,
  saveCustomerDetailsFromPreChatForm,
};
