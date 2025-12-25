'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Enable pgvector extension
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // Create training_chunks table
    await queryInterface.createTable('training_chunks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      chatbot_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      chunk_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      embedding: {
        type: 'VECTOR(1536)',
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false,
      },
    });

    // Create vector index using ivfflat
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS training_chunks_embedding_idx 
      ON training_chunks 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);

    // Create regular index on chatbot_id for fast lookups
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_training_chunks_chatbot_id 
      ON training_chunks (chatbot_id);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('training_chunks');
  },
};
