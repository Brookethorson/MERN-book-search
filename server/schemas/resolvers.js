const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");


const resolvers = {
  Query: {
    //Retrieves the logged in user without specifically searching for them
    me: async (parent, args, context) => {
    
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("books");

        return userData;
      }

      throw new AuthenticationError("Not logged in");
    },
  },

  Mutation: {
    // Creates a single user and creates a jwt token for that user
    addUser: async (parent, args) => {
      try {
    
        const user = await User.create(args);

        const token = signToken(user);

        // Return an `Auth` object that consists of the signed token and user's information
        return { token, user };
      } catch (err) {
        console.log(err);
      }
    },

    // A login mutation finds a specific user by email in the db
    login: async (parent, { email, password }) => {
     
      const user = await User.findOne({ email });

      // If there is no user with that email address, return error
      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

  
      const correctPw = await user.isCorrectPassword(password);

      // If the password is incorrect, return error 
      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

  
      const token = signToken(user);

      return { token, user };
    },

    //Retrieves the logged in user without specifically searching for them
    saveBook: async (parent, args, context) => {
     
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          // Pushes a book to an array of books associated with this user
          { $addToSet: { savedBooks: args.input } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      }

      // If user attempts to execute this mutation and isn't logged in, throw an error
      throw new AuthenticationError("You need to be logged in!");
    },

    //Retrieves the logged in user without specifically searching for them
    removeBook: async (parent, args, context) => {
      
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },

          // Delete the book based on the book ID from the db
          { $pull: { savedBooks: { bookId: args.bookId } } },

          { new: true }
        );

        return updatedUser;
      }
      throw new AuthenticationError("Please login in!");
    },
  },
};

module.exports = resolvers;
